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
console.log("Live before/after with the model is `npm run harness:mission -- --cli` twice, with and without the skill file in context. That spends tokens. This command does not.");
