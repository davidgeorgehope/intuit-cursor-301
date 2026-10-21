import { spawnSync } from "node:child_process";
import { compareChecks } from "@/lib/harness-report";
import { formatBenchmark, loadSkillEval } from "@/lib/skill-eval";

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { cwd: process.cwd(), encoding: "utf8", timeout: 120_000 });
  return typeof result.status === "number" ? result.status : 1;
}

const weakExit = run("node", ["--experimental-strip-types", "--check", "lib/extension-pace.ts"]);
const strongExit = run("npm", ["test", "--", "tests/extension-pace.test.ts"]);
console.log(compareChecks({ weakExit, strongExit }));
console.log("");
console.log(formatBenchmark(loadSkillEval(process.cwd(), "draft-filer-message")));
console.log("");
console.log("This command does not call a model. The live version is `npm run harness:ready-vs-bare`: the same mission run by a real agent on a bare copy and on the agent-ready repo. That spends tokens. Recorded runs are in fallback/ready-vs-bare/.");
