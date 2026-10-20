import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { formatBenchmark, listSkillEvals, loadSkillEval, planTriggerEvals, type TriggerQuery } from "@/lib/skill-eval";
import { runLiveSkillEval } from "@/scripts/eval-live";

const root = process.cwd();
const live = process.argv.includes("--live");
let failed = false;

if (live) {
  process.exit(runLiveSkillEval(root));
}

for (const skill of listSkillEvals(root)) {
  const report = loadSkillEval(root, skill);
  const markdown = formatBenchmark(report);
  console.log(markdown);
  console.log("");
  const outDir = join(root, "artifacts/skill-evals", skill);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "benchmark.md"), `${markdown}\n`);
  const queries = JSON.parse(
    readFileSync(join(root, ".cursor/skills", skill, "evals/trigger-queries.json"), "utf8"),
  ) as TriggerQuery[];
  const trigger = planTriggerEvals(queries);
  writeFileSync(join(outDir, "trigger-evals.json"), `${JSON.stringify(trigger, null, 2)}\n`);
  console.log(`trigger evals: ${trigger.results.length} queries, none executed`);
  const withFailed = report.withSkill.some((run) => run.summary.failed > 0);
  const withoutPerfect = report.withoutSkill.every((run) => run.summary.failed === 0);
  if (withFailed || withoutPerfect || !report.prune.keep) failed = true;
}

if (failed) process.exitCode = 1;
