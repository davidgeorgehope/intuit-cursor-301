import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Grades .cursor/skills/<name>/evals/evals.json.
 * The case shape is prompt, expected_output, and assertions.
 * This module is the offline grader: it quotes evidence and spends no tokens.
 * A model judge uses evals/grader.md and must be a different family from the worker.
 */

export type SkillEvalCase = {
  id: number;
  prompt: string;
  expected_output: string;
  files: string[];
  assertions: string[];
};

export type SkillEvalFile = {
  skill_name: string;
  notes?: string;
  evals: SkillEvalCase[];
};

export type ExpectationGrade = {
  text: string;
  passed: boolean;
  evidence: string;
};

export type RunGrade = {
  evalId: number;
  arm: "with-skill" | "without-skill";
  expectations: ExpectationGrade[];
  summary: { passed: number; failed: number; total: number; pass_rate: number };
};

export type PruneReport = {
  beforeLines: number;
  afterLines: number;
  beforePassRate: number;
  afterPassRate: number;
  keep: boolean;
};

export type SkillEvalReport = {
  skill: string;
  withSkill: RunGrade[];
  withoutSkill: RunGrade[];
  prune: PruneReport;
  tokens: 0;
};

const CLAUSES = [
  "Never include an SSN",
  ".example",
  "Avery Quinn",
  "lib/tax-year.ts",
  "140 words",
  "exclamation",
  "allowed credit",
];

export function lineCount(text: string): number {
  if (text.length === 0) return 0;
  return text.split("\n").length;
}

function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function quote(text: string, pattern: RegExp): string | undefined {
  const match = text.match(pattern);
  if (!match || match.index === undefined) return undefined;
  const start = text.lastIndexOf("\n", match.index) + 1;
  const end = text.indexOf("\n", match.index);
  return text.slice(start, end === -1 ? undefined : end).trim();
}

export function gradeAssertion(output: string, assertion: string): ExpectationGrade {
  const fail = (evidence: string): ExpectationGrade => ({ text: assertion, passed: false, evidence });
  const pass = (evidence: string): ExpectationGrade => ({ text: assertion, passed: true, evidence });

  if (assertion.startsWith("Names return")) {
    const named = quote(output, /TY25-1042/);
    const code = quote(output, /IND-032-04/);
    const offEmail = /do not send it by email/i.test(output);
    if (named && code && offEmail) {
      return pass(`${named} ${code} The note keeps the AGI out of email.`);
    }
    return fail("Missing the return number, IND-032-04, or the instruction not to email the AGI.");
  }

  if (assertion.startsWith("States the allowed credit")) {
    const allowed = quote(output, /\$2,500\.00/);
    const treatsClaimAsCredit = /credit is \$4,000\.00/i.test(output);
    if (allowed && !treatsClaimAsCredit) return pass(allowed);
    if (treatsClaimAsCredit) return fail(quote(output, /credit is \$4,000\.00/i) ?? "Treats the claim as the credit.");
    return fail("Does not state the allowed credit of $2,500.00.");
  }

  if (assertion.startsWith("Signed Avery Quinn")) {
    if (/ssn/i.test(output) || /\b\d{3}-\d{2}-\d{4}\b/.test(output)) {
      return fail(quote(output, /ssn/i) ?? "Mentions an SSN.");
    }
    const signature = quote(output, /Avery Quinn/);
    if (!signature) return fail("Missing Avery Quinn.");
    return pass(signature);
  }

  if (assertion.startsWith("No exclamation mark")) {
    if (output.includes("!")) return fail("The output has an exclamation mark.");
    if (words(output) > 140) return fail(`Body is ${words(output)} words.`);
    return pass(`No exclamation mark. ${words(output)} words.`);
  }

  return fail("No grader for this assertion.");
}

function summarize(expectations: ExpectationGrade[]) {
  const passed = expectations.filter((entry) => entry.passed).length;
  const total = expectations.length;
  return { passed, failed: total - passed, total, pass_rate: total === 0 ? 0 : passed / total };
}

function gradeArm(
  skillDir: string,
  evalCase: SkillEvalCase,
  arm: "with-skill" | "without-skill",
): RunGrade {
  const output = readFileSync(join(skillDir, "evals/runs", arm, `${evalCase.id}.txt`), "utf8");
  const expectations = evalCase.assertions.map((assertion) => gradeAssertion(output, assertion));
  return { evalId: evalCase.id, arm, expectations, summary: summarize(expectations) };
}

function passRate(runs: RunGrade[]): number {
  const passed = runs.reduce((total, run) => total + run.summary.passed, 0);
  const all = runs.reduce((total, run) => total + run.summary.total, 0);
  return all === 0 ? 0 : passed / all;
}

export function loadSkillEval(root: string, skillName = "draft-filer-message"): SkillEvalReport {
  const skillDir = join(root, ".cursor/skills", skillName);
  const file = JSON.parse(readFileSync(join(skillDir, "evals/evals.json"), "utf8")) as SkillEvalFile;
  const withSkill = file.evals.map((entry) => gradeArm(skillDir, entry, "with-skill"));
  const withoutSkill = file.evals.map((entry) => gradeArm(skillDir, entry, "without-skill"));
  const before = readFileSync(join(skillDir, "evals/snapshots/verbose/SKILL.md"), "utf8");
  const after = readFileSync(join(skillDir, "SKILL.md"), "utf8");
  const beforeClauses = CLAUSES.filter((clause) => before.includes(clause)).length;
  const afterClauses = CLAUSES.filter((clause) => after.includes(clause)).length;
  const beforePassRate = passRate(withSkill);
  const afterPassRate = passRate(withSkill);
  return {
    skill: skillName,
    withSkill,
    withoutSkill,
    prune: {
      beforeLines: lineCount(before),
      afterLines: lineCount(after),
      beforePassRate,
      afterPassRate,
      keep:
        beforeClauses === CLAUSES.length &&
        afterClauses === CLAUSES.length &&
        beforePassRate === afterPassRate &&
        beforePassRate === 1 &&
        lineCount(after) < lineCount(before),
    },
    tokens: 0,
  };
}

export function listSkillEvals(root: string): string[] {
  const dir = join(root, ".cursor/skills");
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(dir, entry.name, "evals/evals.json")))
    .map((entry) => entry.name)
    .sort();
}

function percent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function formatBenchmark(report: SkillEvalReport): string {
  const lines = [
    `# ${report.skill}`,
    "",
    "| Arm | Assertions passed | Pass rate |",
    "| --- | --- | --- |",
    `| with skill | ${report.withSkill.reduce((n, run) => n + run.summary.passed, 0)}/${report.withSkill.reduce((n, run) => n + run.summary.total, 0)} | ${percent(report.prune.beforePassRate)} |`,
    `| without skill | ${report.withoutSkill.reduce((n, run) => n + run.summary.passed, 0)}/${report.withoutSkill.reduce((n, run) => n + run.summary.total, 0)} | ${percent(passRate(report.withoutSkill))} |`,
    "",
    `Prune: ${report.prune.beforeLines} lines -> ${report.prune.afterLines} lines. Pass rate ${percent(report.prune.beforePassRate)} -> ${percent(report.prune.afterPassRate)}. ${report.prune.keep ? "Keep the cut." : "Restore the cut."}`,
    "",
    "tokens: 0 (offline grader; a model judge spends tokens)",
  ];
  for (const run of report.withoutSkill) {
    for (const expectation of run.expectations) {
      if (!expectation.passed) lines.push(`- eval ${run.evalId} FAIL: ${expectation.evidence}`);
    }
  }
  return lines.join("\n");
}

export type TriggerQuery = { query: string; should_trigger: boolean };

export type TriggerResult = {
  query: string;
  should_trigger: boolean;
  passed: null;
  reason: string;
};

export const WORKER_MODEL = "composer-2.5";
export const JUDGE_MODEL = "claude-opus-5";

export const LIVE_COST_WARNING = [
  "Token cost: --live calls the model.",
  `The worker is ${WORKER_MODEL} and writes each arm.`,
  `The judge is ${JUDGE_MODEL}, a different family, and scores both arms under labels.`,
  "Each trigger query is one more cursor-agent -p run.",
  "The offline replay cannot catch a prune that only fails when a model writes a new message.",
].join(" ");

export function skillFilesForTrigger(): string[] {
  return ["SKILL.md"];
}

export function skillWasRead(stream: string): boolean {
  return stream.includes("draft-filer-message/SKILL.md");
}

export function planTriggerEvals(queries: TriggerQuery[]): { command: string; results: TriggerResult[] } {
  return {
    command:
      "cursor-agent -p --output-format stream-json --trust --mode ask \"<query>\"",
    results: queries.map((query) => ({
      query: query.query,
      should_trigger: query.should_trigger,
      passed: null,
      reason: "Not run. cursor-agent -p spends tokens. A run counts as triggered only if the stream shows a read of SKILL.md. A crash is passed: null, not a negative.",
    })),
  };
}
