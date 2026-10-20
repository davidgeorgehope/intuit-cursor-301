import { describe, expect, it } from "vitest";
import {
  formatBenchmark,
  listSkillEvals,
  LIVE_COST_WARNING,
  loadSkillEval,
  planTriggerEvals,
  skillFilesForTrigger,
  skillWasRead,
} from "@/lib/skill-eval";

describe("skill eval loader", () => {
  it("passes the with-skill arm and fails the without-skill arm", () => {
    const report = loadSkillEval(process.cwd(), "draft-filer-message");
    expect(report.tokens).toBe(0);
    expect(report.withSkill.every((run) => run.summary.pass_rate === 1)).toBe(true);
    expect(report.withoutSkill.every((run) => run.summary.pass_rate < 1)).toBe(true);
  });

  it("keeps the shorter skill only when the pass rate holds", () => {
    const report = loadSkillEval(process.cwd(), "draft-filer-message");
    expect(report.prune.keep).toBe(true);
    expect(report.prune.afterLines).toBeLessThan(report.prune.beforeLines);
    expect(report.prune.beforePassRate).toBe(report.prune.afterPassRate);
  });

  it("plans a headless trigger eval and does not run it", () => {
    const plan = planTriggerEvals([
      { query: "Draft the message for TY25-1042.", should_trigger: true },
      { query: "What does IND-032-04 mean?", should_trigger: false },
    ]);
    expect(plan.command).toContain("cursor-agent -p");
    expect(plan.results.every((result) => result.passed === null)).toBe(true);
    expect(skillFilesForTrigger()).toEqual(["SKILL.md"]);
    expect(formatBenchmark(loadSkillEval(process.cwd()))).toContain("tokens: 0");
    expect(listSkillEvals(process.cwd())).toEqual(["draft-filer-message"]);
    expect(LIVE_COST_WARNING).toContain("Token cost");
    expect(skillWasRead('{"path":".cursor/skills/draft-filer-message/SKILL.md"}')).toBe(true);
    expect(skillWasRead("no file here")).toBe(false);
  });
});