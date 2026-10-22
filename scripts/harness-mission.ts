import { agentBin } from "@/lib/agent-bin";
import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import { getMission } from "@/lib/missions";
import { buildDryRunStream } from "@/lib/harness-report";
import { summarizeStream } from "@/lib/harness-stream";

// Three modes:
//   (default) dry-run  OFFLINE FALLBACK. No model is called. It runs the real
//                      done-when command and wraps the result in a simulated
//                      stream-json shape. costUsd is 0 because nothing ran.
//   --cli              REAL. agent -p --output-format stream-json works the mission,
//                      then the harness runs done-when itself. Spends tokens.
//   --sdk              REAL. scripts/sdk/mission-runner.ts (@cursor/sdk, local runtime)
//                      works the mission and loops on done-when. Spends tokens.
// Add --read-only to --cli or --sdk for a no-edit check (ask mode / disallowedTools).
// Add --model <id> to pick a model (default composer-2.5).

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const missionId = flag("--mission") ?? "extension-pace";
const mode = args.includes("--cli") ? "cli" : args.includes("--sdk") ? "sdk" : "dry-run";
const readOnly = args.includes("--read-only");
const model = flag("--model") ?? process.env.HARNESS_MODEL ?? "composer-2.5";

const spec = getMission(missionId);
if (!spec) {
  console.error("Unknown mission. Use --mission extension-pace or --mission verify-console.");
  process.exit(1);
}
const mission = { id: missionId, ...spec };

function runDoneWhen() {
  const [command, ...commandArgs] = mission.doneWhenArgs;
  const result = spawnSync(command, commandArgs, { cwd: process.cwd(), encoding: "utf8", timeout: 120_000 });
  const exitCode = typeof result.status === "number" ? result.status : 1;
  const summary = (result.stdout || result.stderr || "").trim().split("\n").slice(-3).join(" ");
  return { exitCode, summary };
}

const readOnlyPrompt = `Read missions/${missionId}/MISSION.md and say whether the done-when command is present. Do not edit files.`;
const missionPrompt = [
  `Mission: ${mission.title}.`,
  `Outcome: ${mission.outcome}`,
  `Done when: \`${mission.doneWhen}\` exits 0. Run it yourself before you say you are done.`,
  `Read missions/${missionId}/MISSION.md first. Stay inside the mission.`,
].join("\n");

async function runCli() {
  if (spawnSync(agentBin(), ["--version"], { encoding: "utf8" }).status !== 0) {
    console.error("The Cursor CLI (agent) is not on PATH. Install it and run agent login, or use the dry-run.");
    process.exit(2);
  }
  const before = readOnly ? null : runDoneWhen();
  if (before) console.log(JSON.stringify({ type: "done_when", phase: "before", command: mission.doneWhen, exitCode: before.exitCode }));
  const cliArgs = ["--print", "--output-format", "stream-json", "--trust", "--model", model];
  if (readOnly) cliArgs.push("--mode", "ask");
  else cliArgs.push("--force");
  cliArgs.push(readOnly ? readOnlyPrompt : missionPrompt);
  const child = spawn(agentBin(), cliArgs, { cwd: process.cwd(), stdio: ["ignore", "pipe", "inherit"] });
  const lines: string[] = [];
  for await (const line of createInterface({ input: child.stdout })) {
    lines.push(line);
    // Pass real events through. Skip per-token thinking deltas so the screen stays readable.
    if (!line.includes('"type":"thinking"')) console.log(line.length > 400 ? `${line.slice(0, 400)}…` : line);
  }
  const code: number = await new Promise((r) => child.on("close", (c) => r(c ?? 1)));
  const s = summarizeStream(lines);
  const after = readOnly ? null : runDoneWhen();
  console.log(
    JSON.stringify({
      type: "harness_result",
      mode: "cli",
      model,
      agentExit: code,
      doneWhenExit: after?.exitCode ?? null,
      ranTests: s.ranTests,
      toolCalls: s.toolCalls,
      totalTokens: s.totalTokens,
      durationMs: s.durationMs,
      note: "Tokens come from the CLI result event. The CLI does not report dollars; see the usage dashboard.",
    }),
  );
  if (after && after.exitCode !== 0) process.exitCode = after.exitCode;
}

function runSdk() {
  const script = readOnly ? "scripts/sdk/readonly-cost.ts" : "scripts/sdk/mission-runner.ts";
  const r = spawnSync("npx", ["tsx", script, "--mission", missionId], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env, HARNESS_MODEL: model, NODE_NO_WARNINGS: "1" },
  });
  process.exitCode = r.status ?? 1;
}

async function main() {
  if (mode === "cli") return runCli();
  if (mode === "sdk") return runSdk();
  console.error("DRY-RUN (offline fallback): no model was called. The stream below is simulated around the real done-when result. Use --cli or --sdk for a real agent run.");
  const { exitCode, summary } = runDoneWhen();
  for (const event of buildDryRunStream({ mission, exitCode, summary })) {
    console.log(JSON.stringify(event));
  }
  if (exitCode !== 0) process.exitCode = exitCode;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
