import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { planTriggerEvals, type TriggerQuery } from "@/lib/skill-eval";
import { runLiveTrigger } from "@/scripts/eval-live";

const root = process.cwd();
if (process.argv.includes("--live")) {
  process.exit(runLiveTrigger(root));
}

const queries = JSON.parse(
  readFileSync(join(root, ".cursor/skills/draft-filer-message/evals/trigger-queries.json"), "utf8"),
) as TriggerQuery[];
const trigger = planTriggerEvals(queries);
const outDir = join(root, "artifacts/skill-evals/draft-filer-message");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "trigger-evals.json"), `${JSON.stringify(trigger, null, 2)}\n`);
console.log(`trigger evals: ${trigger.results.length} queries, none executed`);
console.log(trigger.command);
