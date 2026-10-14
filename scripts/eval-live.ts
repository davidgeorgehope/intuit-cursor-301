import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gradeAssertion, JUDGE_MODEL, LIVE_COST_WARNING, skillWasRead, WORKER_MODEL, type SkillEvalFile, type TriggerQuery } from "@/lib/skill-eval";

const FACTS = `Return TY25-1042 is Remy and Ana Sato. Rejected 6 Oct 2026, code IND-032-04. Ana's prior-year AGI was entered from a draft. The extension deadline is 15 Oct 2026, seven days from the console clock of 8 Oct 2026.

Return TY25-1043 is Ellis Marlow. The open review claims $4,000.00 of American opportunity credit. The allowed credit is $2,500.00 per student. The claim stays on the return.
`;

export function findAgentBinary(): string | null {
  for (const name of ["cursor-agent", "agent"]) {
    const found = spawnSync("bash", ["-lc", `command -v ${name}`], { encoding: "utf8" });
    const path = found.stdout.trim();
    if (found.status === 0 && path) return path;
  }
  return null;
}

function agentArgs(model: string, format: "text" | "stream-json"): string[] {
  return ["-p", "--trust", "--force", "--mode", "ask", "--output-format", format, "--model", model];
}

function runAgent(binary: string, cwd: string, model: string, format: "text" | "stream-json", prompt: string) {
  return spawnSync(binary, [...agentArgs(model, format), prompt], {
    cwd,
    encoding: "utf8",
    timeout: 180_000,
  });
}

function writeArm(dir: string, withSkill: boolean, skillPath: string) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "return-notes.md"), FACTS);
  if (!withSkill) return;
  const dest = join(dir, ".cursor/skills/draft-filer-message");
  mkdirSync(dest, { recursive: true });
  writeFileSync(join(dest, "SKILL.md"), readFileSync(skillPath, "utf8"));
}

export function runLiveSkillEval(root: string): number {
  console.error(LIVE_COST_WARNING);
  const binary = findAgentBinary();
  if (!binary) {
    console.error("cursor-agent is not on PATH. Install the Cursor CLI and log in, then rerun. No model call was made.");
    return 1;
  }
  const file = JSON.parse(
    readFileSync(join(root, ".cursor/skills/draft-filer-message/evals/evals.json"), "utf8"),
  ) as SkillEvalFile;
  const skillPath = join(root, ".cursor/skills/draft-filer-message/SKILL.md");
  const grader = readFileSync(join(root, ".cursor/skills/draft-filer-message/evals/grader.md"), "utf8");
  const outRoot = join(root, "artifacts/skill-evals/live");
  mkdirSync(outRoot, { recursive: true });
  const base = mkdtempSync(join(tmpdir(), "filer-note-"));
  try {
    for (const entry of file.evals) {
      for (const arm of ["with-skill", "without-skill"] as const) {
        const dir = join(base, `${arm}-${entry.id}`);
        writeArm(dir, arm === "with-skill", skillPath);
        const prompt = `${entry.prompt}\n\nUse return-notes.md for the facts. Reply with the message only.`;
        const result = runAgent(binary, dir, WORKER_MODEL, "text", prompt);
        const text = result.stdout || result.stderr || "";
        const dest = join(outRoot, arm);
        mkdirSync(dest, { recursive: true });
        writeFileSync(join(dest, `${entry.id}.txt`), text);
        if (result.status !== 0) {
          console.error(`worker arm ${arm} eval ${entry.id} exited ${result.status ?? "unknown"}`);
          return result.status ?? 1;
        }
      }
      const withText = readFileSync(join(outRoot, "with-skill", `${entry.id}.txt`), "utf8");
      const withoutText = readFileSync(join(outRoot, "without-skill", `${entry.id}.txt`), "utf8");
      const judgePrompt = `${grader}\n\narm-a:\n${withText}\n\narm-b:\n${withoutText}\n\nAssertions:\n${entry.assertions.map((item) => `- ${item}`).join("\n")}`;
      const judged = runAgent(binary, base, JUDGE_MODEL, "text", judgePrompt);
      writeFileSync(join(outRoot, `judge-${entry.id}.txt`), judged.stdout || judged.stderr || "");
      if (judged.status !== 0) return judged.status ?? 1;
      for (const assertion of entry.assertions) {
        const graded = gradeAssertion(withText, assertion);
        console.log(`${graded.passed ? "PASS" : "FAIL"} with-skill eval ${entry.id}: ${graded.evidence}`);
      }
    }
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
  console.log(`live arms: ${outRoot}`);
  return 0;
}

export function runLiveTrigger(root: string): number {
  console.error(LIVE_COST_WARNING);
  const binary = findAgentBinary();
  const queries = JSON.parse(
    readFileSync(join(root, ".cursor/skills/draft-filer-message/evals/trigger-queries.json"), "utf8"),
  ) as TriggerQuery[];
  if (!binary) {
    console.error("cursor-agent is not on PATH. Install the Cursor CLI and log in, then rerun. No model call was made.");
    return 1;
  }
  const skillPath = join(root, ".cursor/skills/draft-filer-message/SKILL.md");
  const outPath = join(root, "artifacts/skill-evals/live/trigger-evals.json");
  mkdirSync(join(root, "artifacts/skill-evals/live"), { recursive: true });
  const results = [];
  for (const query of queries) {
    const dir = mkdtempSync(join(tmpdir(), "filer-trigger-"));
    try {
      const dest = join(dir, ".cursor/skills/draft-filer-message");
      mkdirSync(dest, { recursive: true });
      writeFileSync(join(dest, "SKILL.md"), readFileSync(skillPath, "utf8"));
      const result = runAgent(binary, dir, WORKER_MODEL, "stream-json", query.query);
      const stream = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
      const crashed = result.status !== 0 || result.error != null;
      const triggered = skillWasRead(stream);
      const passed = crashed ? null : triggered === query.should_trigger;
      results.push({ query: query.query, should_trigger: query.should_trigger, passed, triggered });
      console.log(`${passed === null ? "CRASH" : passed ? "PASS" : "FAIL"} trigger ${JSON.stringify(query.query)}`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  writeFileSync(outPath, `${JSON.stringify(results, null, 2)}\n`);
  return results.some((result) => result.passed === false) ? 1 : 0;
}
