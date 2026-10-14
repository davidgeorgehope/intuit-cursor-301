import { spawnSync } from "node:child_process";
import { getMission } from "@/lib/missions";
import { buildDryRunStream } from "@/lib/harness-report";

const args = process.argv.slice(2);
const missionFlag = args.indexOf("--mission");
const missionId = missionFlag >= 0 ? args[missionFlag + 1] : "extension-pace";
const mode = args.includes("--cli") ? "cli" : args.includes("--sdk") ? "sdk" : "dry-run";

const spec = missionId ? getMission(missionId) : undefined;
if (!missionId || !spec) {
  console.error("Unknown mission. Use --mission extension-pace or --mission verify-console.");
  process.exit(1);
}

const mission = { id: missionId, ...spec };

if (mode === "cli") {
  console.log(
    JSON.stringify({
      type: "result",
      subtype: "skipped",
      is_error: false,
      costUsd: 0,
      note: "CLI path spends tokens. Run it yourself when you are logged in: agent -p --output-format stream-json --mode ask \"Read missions/" +
        missionId +
        "/MISSION.md and say whether the done-when command is present. Do not edit files.\"",
    }),
  );
  process.exit(0);
}

if (mode === "sdk") {
  console.log(
    JSON.stringify({
      type: "result",
      subtype: "skipped",
      is_error: false,
      costUsd: 0,
      note: "SDK path spends tokens and needs @cursor/sdk plus CURSOR_API_KEY. Local pattern: Agent.create({ apiKey, model: { id: 'composer-2.5' }, disallowedTools: ['shell'], local: { cwd } }), then run.stream() and agent.getUsage() for dollars. Token counts on the stream are not dollars. Do not pass cloud: this workshop stays on the local runtime.",
    }),
  );
  process.exit(0);
}

const [command, ...commandArgs] = mission.doneWhenArgs;
const result = spawnSync(command, commandArgs, { cwd: process.cwd(), encoding: "utf8", timeout: 120_000 });
const exitCode = typeof result.status === "number" ? result.status : 1;
const summary = (result.stdout || result.stderr || "").trim().split("\n").slice(-3).join(" ");
for (const event of buildDryRunStream({ mission, exitCode, summary })) {
  console.log(JSON.stringify(event));
}
if (exitCode !== 0) process.exitCode = exitCode;
