import { agentBin } from "@/lib/agent-bin";
// Same mission, same prompt, same model, run twice by a real agent:
//   A = bare copy: code only. No AGENTS.md, no .cursor (rules, skills, hooks),
//       no tests, no test script, no mission files, cold (no node_modules).
//   B = agent-ready copy: AGENTS.md, .mdc rules, skills, hooks, the mission
//       armed with a real unit test as done-when, warm (deps installed).
// The harness then grades both edits with the same hidden unit test in a
// clean third copy. It spends tokens. Nothing here uses a cloud runtime.
//
// Usage:
//   npm run harness:ready-vs-bare                    # CLI runner (agent -p)
//   npm run harness:ready-vs-bare -- --runner sdk    # @cursor/sdk local runtime
//   npm run harness:ready-vs-bare -- --model composer-2.5 --save fallback/ready-vs-bare/2026-10-21
import { execSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { compactStream, summarizeStream, type StreamSummary } from "@/lib/harness-stream";

const repo = process.cwd();
const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const runner = arg("--runner", "cli");
const model = arg("--model", process.env.HARNESS_MODEL ?? "composer-2.5");
const saveDir = process.argv.includes("--save") ? resolve(arg("--save", "")) : "";
const only = arg("--only", "AB");

// The same symptom-only bug report goes to both agents.
const PROMPT =
  "Bug report from the expert team: on the rejects page, every rejected return shows the wrong number of extension days left. Fix it.";

// Planted bug: the countdown ages against the wall clock instead of the frozen demo clock.
const PLANTED = `import { daysBetween } from "@/lib/dates";
import { EXTENSION_DEADLINE } from "@/lib/tax-year";

/** Days left until the Oct 15 extension deadline. */
export function extensionDaysLeft(asOf: Date = new Date()): number {
  return daysBetween(EXTENSION_DEADLINE, asOf);
}
`;

// Things a bare copy does not get. Code stays; context, tests, and harness go.
const BARE_REMOVE = [
  "AGENTS.md",
  "app/api/AGENTS.md",
  ".cursor",
  "tests",
  "missions",
  "scripts",
  "fallback",
  "bdk",
  "migrations",
  "README.md",
  "DEMO-401.md",
  "demo-howto.md",
  "CHANGELOG.md",
  "CODEOWNERS",
  "vitest.config.ts",
  "lib/mission-source.ts",
  "lib/missions.ts",
  "lib/harness-report.ts",
  "lib/harness-stream.ts",
  "lib/skill-eval.ts",
  "lib/verify-console.ts",
];

function sh(cmd: string, cwd: string) {
  return execSync(cmd, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function exportHead(dest: string) {
  mkdirSync(dest, { recursive: true });
  sh(`git archive HEAD | tar -x -C "${dest}"`, repo);
}

function gitBaseline(dir: string) {
  sh(`git init -q && git add -A && git -c user.email=harness@example -c user.name=harness commit -qm baseline`, dir);
}

function prepareBare(dir: string) {
  exportHead(dir);
  for (const p of BARE_REMOVE) rmSync(join(dir, p), { recursive: true, force: true });
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  for (const key of Object.keys(pkg.scripts)) {
    if (!["dev", "build", "start", "lint", "typecheck"].includes(key)) delete pkg.scripts[key];
  }
  delete pkg.devDependencies.vitest;
  delete pkg.devDependencies["@cursor/sdk"];
  writeFileSync(join(dir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
  rmSync(join(dir, "package-lock.json"), { force: true });
  writeFileSync(join(dir, "lib/extension-pace.ts"), PLANTED);
  gitBaseline(dir);
}

function prepareReady(dir: string) {
  exportHead(dir);
  // Warm environment: dependencies are already installed (shared from this checkout).
  symlinkSync(join(repo, "node_modules"), join(dir, "node_modules"), "dir");
  writeFileSync(join(dir, "lib/extension-pace.ts"), PLANTED);
  gitBaseline(dir);
  // Arm the mission so the stop hook runs the done-when test after each turn.
  writeFileSync(join(dir, "missions/active.json"), JSON.stringify({ id: "extension-pace" }) + "\n");
}

function runCli(dir: string): string[] {
  const r = spawnSync(
    agentBin(),
    ["--print", "--output-format", "stream-json", "--force", "--trust", "--model", model, PROMPT],
    { cwd: dir, encoding: "utf8", timeout: 15 * 60_000, maxBuffer: 256 * 1024 * 1024, env: { ...process.env } },
  );
  if (r.error) throw r.error;
  if (r.status !== 0 && !r.stdout) throw new Error(`agent exited ${r.status}: ${r.stderr}`);
  return r.stdout.split("\n");
}

function runSdk(dir: string): string[] {
  const r = spawnSync("npx", ["tsx", join(repo, "scripts/sdk/one-shot.ts"), "--cwd", dir, "--model", model, "--prompt", PROMPT], {
    cwd: repo,
    encoding: "utf8",
    timeout: 15 * 60_000,
    maxBuffer: 256 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error(`sdk runner exited ${r.status}: ${r.stderr}`);
  return r.stdout.split("\n");
}

type Grade = { pass: boolean; exitCode: number; usesWallClock: boolean; tail: string };

function grade(agentDir: string, root: string, label: string): Grade {
  const g = join(root, `grade-${label}`);
  exportHead(g);
  symlinkSync(join(repo, "node_modules"), join(g, "node_modules"), "dir");
  // Copy the agent's lib/ over the clean tree. The grader's tests are the hidden check.
  cpSync(join(agentDir, "lib"), join(g, "lib"), { recursive: true });
  const r = spawnSync("npx", ["vitest", "run", "tests/extension-pace.test.ts"], { cwd: g, encoding: "utf8", timeout: 180_000 });
  const exitCode = typeof r.status === "number" ? r.status : 1;
  const src = readFileSync(join(agentDir, "lib/extension-pace.ts"), "utf8");
  const usesWallClock = /new Date\(\s*\)|Date\.now\(/.test(src);
  const tail = `${r.stdout}${r.stderr}`.trim().split("\n").filter((l) => /Tests|✓|×|FAIL|expected/.test(l)).slice(-6).join("\n");
  return { pass: exitCode === 0 && !usesWallClock, exitCode, usesWallClock, tail };
}

function changedFiles(dir: string): string {
  return sh(`git add -A && git diff --cached --stat HEAD`, dir).trim();
}

function row(label: string, s: StreamSummary, g: Grade, files: string) {
  return {
    copy: label,
    claimedDone: !s.isError,
    ranTests: s.ranTests,
    toolCalls: s.toolCalls,
    shellCommands: s.shellCommands.length,
    totalTokens: s.totalTokens,
    durationMs: s.durationMs,
    hiddenTest: g.exitCode === 0 ? "PASS" : "FAIL",
    usesWallClock: g.usesWallClock,
    verdict: g.pass ? "CORRECT" : "WRONG",
    filesChanged: files.split("\n").filter((l) => l.includes("|")).map((l) => l.split("|")[0].trim()),
  };
}

async function main() {
  if (runner === "cli") {
    const which = spawnSync(agentBin(), ["--version"], { encoding: "utf8" });
    if (which.status !== 0) {
      console.error("The Cursor CLI (agent) is not on PATH. Install: curl https://cursor.com/install -fsS | bash, then agent login.");
      process.exit(2);
    }
  } else if (!process.env.CURSOR_API_KEY) {
    console.error("--runner sdk needs CURSOR_API_KEY.");
    process.exit(2);
  }
  if (!existsSync(join(repo, "node_modules"))) {
    console.error("Run npm ci in this checkout first. Copy B borrows its node_modules to stay warm.");
    process.exit(2);
  }
  const root = mkdtempSync(join(tmpdir(), "ready-vs-bare-"));
  console.log(`work dir: ${root}`);
  console.log(`runner: ${runner}  model: ${model}`);
  console.log(`prompt (both copies): ${PROMPT}\n`);

  const results: Record<string, unknown>[] = [];
  const copies = [
    { label: "A-bare", prepare: prepareBare, run: only.includes("A") },
    { label: "B-ready", prepare: prepareReady, run: only.includes("B") },
  ];
  for (const copy of copies) {
    if (!copy.run) continue;
    const dir = join(root, copy.label);
    copy.prepare(dir);
    console.log(`[${copy.label}] running agent in ${dir} ...`);
    const started = Date.now();
    const lines = runner === "sdk" ? runSdk(dir) : runCli(dir);
    const s = summarizeStream(lines);
    const g = grade(dir, root, copy.label);
    const files = changedFiles(dir);
    const r = row(copy.label, s, g, files);
    results.push({ ...r, wallMs: Date.now() - started });
    console.log(JSON.stringify(r));
    console.log(`[${copy.label}] agent's last words: ${s.result.trim().split("\n").slice(0, 6).join(" ").slice(0, 500)}`);
    console.log(`[${copy.label}] hidden test: ${g.tail.replace(/\n/g, " | ")}\n`);
    if (saveDir) {
      mkdirSync(saveDir, { recursive: true });
      writeFileSync(join(saveDir, `${copy.label}.stream.jsonl`), compactStream(lines).join("\n") + "\n");
      writeFileSync(join(saveDir, `${copy.label}.diff`), sh(`git diff --cached HEAD`, dir));
      writeFileSync(join(saveDir, `${copy.label}.final.md`), s.result + "\n");
      writeFileSync(join(saveDir, `${copy.label}.summary.json`), JSON.stringify({ ...r, shell: s.shellCommands, toolKinds: s.toolKinds }, null, 2) + "\n");
    }
  }
  console.log("copy      verdict  hidden-test  ran-tests  tool-calls  tokens    seconds");
  for (const r of results as ReturnType<typeof row>[] & { wallMs: number }[]) {
    console.log(
      `${r.copy.padEnd(9)} ${r.verdict.padEnd(8)} ${r.hiddenTest.padEnd(12)} ${String(r.ranTests).padEnd(10)} ${String(r.toolCalls).padEnd(11)} ${String(r.totalTokens).padEnd(9)} ${(r.durationMs / 1000).toFixed(0)}`,
    );
  }
  if (saveDir) {
    writeFileSync(join(saveDir, "results.json"), JSON.stringify({ runner, model, prompt: PROMPT, date: new Date().toISOString(), results }, null, 2) + "\n");
    console.log(`\nsaved to ${saveDir}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
