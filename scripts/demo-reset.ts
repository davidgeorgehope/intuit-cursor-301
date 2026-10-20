import { execFileSync, spawn } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, resolve } from "node:path";

type SessionEvent = {
  version: 1;
  createdAt: string;
  userRules: Array<{ id?: string; title?: string; path?: string }>;
  personalSkills: Array<{ name: string; path: string }>;
  projectPaths: string[];
  branches: Array<{ name: string; remote?: boolean }>;
  canvases: string[];
  figmaSlides: Array<{ fileKey: string; url?: string }>;
  linear?: {
    teamId: string;
    teamName: string;
    teamKey: string;
    projectId: string;
    issueIds: string[];
  };
};

type RemainingAction = { kind: "cursor-rule" | "figma" | "linear" | "worktree"; detail: string };
type Report = {
  completed: string[];
  skipped: string[];
  remaining: RemainingAction[];
};

const root = resolve(process.cwd());
const sandboxHome = resolve(process.env.DEMO_RESET_HOME ?? homedir());
const eventFile = resolve(process.env.DEMO_RESET_EVENT_FILE ?? ".cursor/demo-session-events.json");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const skipDb = args.includes("--skip-db");
const skipServer = args.includes("--skip-server");
const skipVerify = args.includes("--skip-verify");
const keepBranch = args.includes("--keep-branch");
const confirmLinear = args.includes("--confirm-linear");
const anyOrigin = args.includes("--any-origin");
const knownProjectPaths = new Set<string>();
const EXPECTED_ORIGIN = "intuit-cursor-301";
/** Shipped suite on a clean tree: 0 failed / 59 passed. */
const EXPECTED_PASSED = 59;
/** Demo beats write new files here. Untracked files under these paths are removed on reset. */
const DEMO_OUTPUT_PATHS = [
  "app",
  "components",
  "lib",
  "tests",
  ".cursor/plans",
  ".cursor/rules",
  ".cursor/skills",
  ".cursor/agents",
];

function command(command: string, commandArgs: string[], options: { allowFailure?: boolean } = {}) {
  try {
    return execFileSync(command, commandArgs, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    if (options.allowFailure) {
      const output = error as { stdout?: string | Buffer };
      return output.stdout?.toString() ?? "";
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${command} ${commandArgs.join(" ")} failed: ${message}`);
  }
}

function defaultEvent(): SessionEvent {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    userRules: [],
    personalSkills: [],
    projectPaths: [],
    branches: [],
    canvases: [],
    figmaSlides: [],
  };
}

function readEvent(required = true): SessionEvent {
  if (!existsSync(eventFile)) {
    if (required) throw new Error(`No session event file at ${eventFile}. Run demo:session start first.`);
    return defaultEvent();
  }

  const event = JSON.parse(readFileSync(eventFile, "utf8")) as SessionEvent;
  if (event.version !== 1) throw new Error(`Invalid session event file: ${eventFile}`);
  return {
    ...defaultEvent(),
    ...event,
  };
}

function writeEvent(event: SessionEvent) {
  mkdirSync(dirname(eventFile), { recursive: true });
  writeFileSync(eventFile, `${JSON.stringify(event, null, 2)}\n`);
}

function assertAllowedPath(candidate: string, allowedRoots: string[]) {
  if (!isAbsolute(candidate)) throw new Error(`Expected absolute path: ${candidate}`);
  const absolute = resolve(candidate);
  if (!allowedRoots.some((allowedRoot) => absolute === allowedRoot || absolute.startsWith(`${allowedRoot}/`))) {
    throw new Error(`Refusing to remove path outside the demo allowlist: ${absolute}`);
  }
  return absolute;
}

function removePath(path: string, report: Report) {
  if (!existsSync(path)) {
    report.skipped.push(`Missing: ${path}`);
    return;
  }
  if (dryRun) {
    report.completed.push(`Would remove: ${path}`);
    return;
  }
  rmSync(path, { recursive: lstatSync(path).isDirectory(), force: true });
  report.completed.push(`Removed: ${path}`);
}

function canvasRoot() {
  const slug = root.replace(/^\//, "").replaceAll("/", "-");
  return resolve(sandboxHome, `.cursor/projects/${slug}/canvases`);
}

function validateRemovablePaths(event: SessionEvent) {
  const userRulesRoot = resolve(sandboxHome, ".cursor/rules");
  const userSkillsRoot = resolve(sandboxHome, ".cursor/skills");

  for (const path of event.projectPaths) {
    if (!knownProjectPaths.has(path)) throw new Error(`Unsupported demo project path: ${path}`);
  }
  for (const rule of event.userRules) {
    if (!rule.path) continue;
    assertAllowedPath(rule.path, [userRulesRoot]);
  }
  for (const skill of event.personalSkills) {
    const path = assertAllowedPath(skill.path, [userSkillsRoot]);
    if (dirname(path) !== userSkillsRoot) {
      throw new Error(`Personal skills must be recorded as direct children of ${userSkillsRoot}.`);
    }
  }
  for (const canvas of event.canvases) assertAllowedPath(canvas, [canvasRoot()]);
}

function record(event: SessionEvent) {
  const kind = args[1];
  const value = args[2];
  if (!kind || !value) throw new Error("Usage: demo:session record <rule|skill|project-path|branch|canvas|figma> <value> [metadata]");

  if (kind === "rule") {
    const path = resolve(value);
    assertAllowedPath(path, [resolve(sandboxHome, ".cursor/rules")]);
    event.userRules.push({ path, title: args[3] });
  } else if (kind === "rule-id") {
    event.userRules.push({ id: value, title: args[3] });
  } else if (kind === "skill") {
    event.personalSkills.push({ name: basename(value), path: resolve(value) });
  } else if (kind === "project-path") {
    if (!knownProjectPaths.has(value)) throw new Error(`Unsupported demo project path: ${value}`);
    event.projectPaths.push(value);
  } else if (kind === "branch") {
    event.branches.push({ name: value, remote: args.includes("--remote") });
  } else if (kind === "canvas") {
    event.canvases.push(resolve(value));
  } else if (kind === "figma") {
    event.figmaSlides.push({ fileKey: value, url: args[3] });
  } else if (kind === "linear") {
    const [teamName, teamKey, projectId, issueIds] = args.slice(3);
    if (!teamName || !teamKey || !projectId || !issueIds) {
      throw new Error("Usage: demo:session record linear <teamId> <teamName> <teamKey> <projectId> <issueId,issueId>");
    }
    event.linear = {
      teamId: value,
      teamName,
      teamKey,
      projectId,
      issueIds: issueIds.split(",").filter(Boolean),
    };
  } else {
    throw new Error(`Unknown event type: ${kind}`);
  }

  writeEvent(event);
  console.log(`Recorded ${kind}: ${value}`);
}

function removeLocalArtifacts(event: SessionEvent, report: Report) {
  const projectRulesRoot = resolve(root, ".cursor/rules");
  const projectSkillsRoot = resolve(root, ".cursor/skills");
  const userRulesRoot = resolve(sandboxHome, ".cursor/rules");
  const userSkillsRoot = resolve(sandboxHome, ".cursor/skills");
  const allowedProjectPaths = new Set([...knownProjectPaths].map((path) => resolve(root, path)));

  for (const path of allowedProjectPaths) {
    assertAllowedPath(path, [projectRulesRoot, projectSkillsRoot]);
    removePath(path, report);
  }

  for (const rule of event.userRules) {
    if (rule.path) {
      removePath(assertAllowedPath(rule.path, [userRulesRoot]), report);
    } else if (rule.id) {
      report.remaining.push({ kind: "cursor-rule", detail: `Remove Cursor user rule ${rule.id}${rule.title ? ` (${rule.title})` : ""}.` });
    }
  }

  for (const skill of event.personalSkills) {
    const skillPath = assertAllowedPath(skill.path, [userSkillsRoot]);
    if (dirname(skillPath) !== userSkillsRoot) {
      throw new Error(`Personal skills must be recorded as direct children of ${userSkillsRoot}.`);
    }
    removePath(skillPath, report);
  }

  for (const canvas of event.canvases) {
    removePath(assertAllowedPath(canvas, [canvasRoot()]), report);
  }
}

function resetGit(event: SessionEvent, report: Report) {
  if (dryRun) {
    report.completed.push("Would run: git reset --hard HEAD");
  } else {
    command("git", ["reset", "--hard", "HEAD"]);
    report.completed.push("Restored tracked files with git reset --hard HEAD.");
  }

  const currentBranch = command("git", ["branch", "--show-current"]).trim();
  if (currentBranch && currentBranch !== "main" && !keepBranch) {
    if (dryRun) report.completed.push(`Would switch ${currentBranch} to main.`);
    else {
      command("git", ["switch", "main"]);
      report.completed.push("Switched to main.");
    }
  } else if (keepBranch) {
    report.skipped.push(`Kept current branch for isolated verification: ${currentBranch}`);
  }

  for (const branch of event.branches) {
    if (branch.name === "main" || branch.name === "master") {
      report.skipped.push(`Protected branch: ${branch.name}`);
      continue;
    }
    if (dryRun) {
      report.completed.push(`Would delete local branch: ${branch.name}`);
      if (branch.remote) report.completed.push(`Would delete remote branch: ${branch.name}`);
      continue;
    }
    command("git", ["branch", "-D", branch.name], { allowFailure: true });
    report.completed.push(`Deleted local branch if present: ${branch.name}`);
    if (branch.remote) {
      command("git", ["push", "origin", "--delete", branch.name], { allowFailure: true });
      report.completed.push(`Deleted remote branch if present: ${branch.name}`);
    }
  }
}

function reseedAndStart(report: Report) {
  if (!skipDb) {
    if (dryRun) report.completed.push("Would run: npx prisma db seed");
    else {
      command("npx", ["prisma", "db", "seed"]);
      report.completed.push("Reseeded SQLite.");
    }
  }

  if (skipServer) return;
  const pids = command("lsof", ["-ti", ":43173"], { allowFailure: true })
    .split(/\s+/)
    .filter(Boolean);
  if (dryRun) {
    if (pids.length) report.completed.push(`Would stop port 43173 PIDs: ${pids.join(", ")}`);
    report.completed.push("Would start npm run dev on port 43173.");
    return;
  }
  for (const pid of pids) process.kill(Number(pid), "SIGTERM");
  const child = spawn("npm", ["run", "dev"], {
    cwd: root,
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  report.completed.push("Started the dev server on port 43173.");
}

function assertDemoOrigin() {
  if (anyOrigin) return;
  const origin = command("git", ["remote", "get-url", "origin"], { allowFailure: true }).trim();
  if (!origin.includes(EXPECTED_ORIGIN)) {
    throw new Error(
      `Refusing to reset: origin is "${origin || "missing"}", not the ${EXPECTED_ORIGIN} demo repo. Pass --any-origin to override.`,
    );
  }
}

function removeDemoOutputs(report: Report) {
  const untracked = command("git", ["ls-files", "--others", "--exclude-standard", "--", ...DEMO_OUTPUT_PATHS])
    .split("\n")
    .filter(Boolean);
  if (untracked.length === 0) {
    report.skipped.push("No untracked demo output files.");
    return;
  }
  for (const relativePath of untracked) {
    removePath(resolve(root, relativePath), report);
  }
}

function reportWorktrees(report: Report) {
  const worktrees = command("git", ["worktree", "list", "--porcelain"], { allowFailure: true })
    .split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => line.slice("worktree ".length))
    .filter((path) => resolve(path) !== root);
  for (const path of worktrees) {
    report.remaining.push({ kind: "worktree", detail: `Remove demo worktree ${path} with git worktree remove.` });
  }
}

function verifyTests(report: Report) {
  if (skipVerify || dryRun) return;
  const output = command("npm", ["test"], { allowFailure: true });
  const summary = output.match(/Tests\s+(?:(\d+) failed \| )?(\d+) passed/);
  if (!summary || summary[1] !== undefined || Number(summary[2]) !== EXPECTED_PASSED) {
    throw new Error(`The reset suite did not report the expected 0 failed / ${EXPECTED_PASSED} passed result.`);
  }
  report.completed.push(`Confirmed the expected 0 failed / ${EXPECTED_PASSED} passed test result.`);
}

async function cancelWithLinearApi(event: SessionEvent, report: Report) {
  if (!event.linear || !process.env.LINEAR_API_KEY || !confirmLinear || process.env.DEMO_RESET_DISABLE_LINEAR === "1") return;

  const request = async (query: string, variables: Record<string, unknown>) => {
    const response = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        Authorization: process.env.LINEAR_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });
    const body = (await response.json()) as { data?: Record<string, unknown>; errors?: Array<{ message: string }> };
    if (!response.ok || body.errors?.length) throw new Error(body.errors?.map((error) => error.message).join("; ") ?? response.statusText);
    return body.data ?? {};
  };

  try {
    const identity = await request(
      `query ResetIdentity($projectId: String!) {
        viewer { id teams { nodes { id name key private } } }
        project(id: $projectId) { id teams { nodes { id } } lead { id } }
      }`,
      { projectId: event.linear.projectId },
    );
    const viewer = identity.viewer as { id: string; teams: { nodes: Array<{ id: string; name: string; key: string; private: boolean }> } };
    const project = identity.project as { id: string; teams: { nodes: Array<{ id: string }> }; lead: { id: string } | null };
    const team = viewer.teams.nodes.find((candidate) => candidate.id === event.linear!.teamId);
    const projectTeams = project.teams.nodes.map((candidate) => candidate.id);
    if (!team?.private || team.name !== event.linear.teamName || team.key !== event.linear.teamKey || projectTeams.length !== 1 || projectTeams[0] !== team.id || project.lead?.id !== viewer.id) {
      throw new Error("Recorded Linear board does not match the operator's exact private team.");
    }

    const states = await request(
      `query ResetStates($teamId: String!) { team(id: $teamId) { states { nodes { id type } } } }`,
      { teamId: team.id },
    );
    const nodes = ((states.team as { states: { nodes: Array<{ id: string; type: string }> } }).states.nodes);
    const canceledState = nodes.find((state) => state.type.toLowerCase() === "canceled");
    if (!canceledState) throw new Error("The confirmed Linear team has no Canceled workflow state.");

    for (const issueId of event.linear.issueIds) {
      await request(
        `mutation CancelIssue($id: String!, $stateId: String!) {
          issueUpdate(id: $id, input: { stateId: $stateId }) { success }
        }`,
        { id: issueId, stateId: canceledState.id },
      );
    }
    await request(
      `mutation CancelProject($id: String!) {
        projectUpdate(id: $id, input: { status: "canceled" }) { success }
      }`,
      { id: event.linear.projectId },
    );
    report.completed.push(`Canceled recorded Linear board ${event.linear.projectId} through the Linear API.`);
  } catch (error) {
    report.skipped.push(`Linear API skipped: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function remainingExternalActions(event: SessionEvent, report: Report) {
  for (const slide of event.figmaSlides) {
    report.remaining.push({ kind: "figma", detail: `Empty Figma Slides file ${slide.fileKey} with use_figma.` });
  }
  if (event.linear && !report.completed.some((entry) => entry.includes(`Linear board ${event.linear!.projectId}`))) {
    report.remaining.push({
      kind: "linear",
      detail: `Cancel recorded Linear project ${event.linear.projectId} and issues ${event.linear.issueIds.join(", ")} after confirming private team ${event.linear.teamName} (${event.linear.teamKey}).`,
    });
  }
}

async function reset() {
  assertDemoOrigin();
  const event = readEvent(false);
  const report: Report = { completed: [], skipped: [], remaining: [] };
  validateRemovablePaths(event);
  if (!existsSync(eventFile)) {
    report.skipped.push(
      `No session event file at ${eventFile}. Reset tracked files and demo output folders only; unrecorded personal rules, skills, Canvas files, and branches need manual cleanup.`,
    );
  }
  resetGit(event, report);
  removeDemoOutputs(report);
  removeLocalArtifacts(event, report);
  reportWorktrees(report);
  reseedAndStart(report);
  await cancelWithLinearApi(event, report);
  remainingExternalActions(event, report);
  verifyTests(report);
  if (!dryRun) {
    const linearCompleted = report.completed.some((entry) => entry.includes(`Linear board ${event.linear?.projectId}`));
    writeEvent({
      ...defaultEvent(),
      userRules: event.userRules.filter((rule) => !rule.path),
      figmaSlides: event.figmaSlides,
      linear: linearCompleted ? undefined : event.linear,
    });
  }
  console.log(JSON.stringify(report, null, 2));
}

async function main() {
const action = args[0] ?? "status";
if (action === "start") {
  writeEvent(defaultEvent());
  console.log(`Started demo session at ${eventFile}`);
} else if (action === "record") {
  record(readEvent());
} else if (action === "status") {
  console.log(JSON.stringify(readEvent(false), null, 2));
} else if (action === "reset") {
  await reset();
} else {
  throw new Error(`Unknown action: ${action}`);
}
}

void main();
