import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkPrompt } from "@/.cursor/hooks/synthetic-prompt.mjs";
import {
  PROJECT_AGENTS,
  PROJECT_SKILLS,
  RUNBOOK_SECTIONS_301,
  RUNBOOK_TRACKS,
  runbookBeats,
} from "@/lib/runbooks/meta";

const root = process.cwd();
const read = (relative: string) => readFileSync(join(root, relative), "utf8");
const beats301 = runbookBeats("301");
const beat = (id: string) => beats301.find((entry) => entry.id === id);

describe("runbook catalog", () => {
  it("ships only the 301 track", () => {
    expect(RUNBOOK_TRACKS.map((track) => track.id)).toEqual(["301"]);
    expect(RUNBOOK_TRACKS[0].description).toBe(
      "You will engineer the context an agent sees, decompose one feature into scoped sessions, orchestrate the parts that split behind a single approval gate, and match each role to a model on purpose.",
    );
    expect(read(".cursor/skills/choose-cursor-workflow/SKILL.md")).toContain(RUNBOOK_TRACKS[0].description);
  });

  it("follows the deck's agenda", () => {
    expect(RUNBOOK_SECTIONS_301.map((section) => section.id)).toEqual([
      "context-engineering",
      "decompose-scope",
      "orchestrate",
      "cost-engineering",
    ]);
    expect(RUNBOOK_SECTIONS_301.map((section) => section.title)).toEqual([
      "How do you engineer context?",
      "How do you decompose a feature?",
      "How do you orchestrate the work?",
      "How do you spend tokens on purpose?",
    ]);
    for (const section of RUNBOOK_SECTIONS_301) {
      expect(section.title).not.toMatch(/^Demo \d+$/);
    }
  });

  it("keeps the live-demo beats and their prompts", () => {
    expect(beats301.map((entry) => entry.id)).toEqual([
      "open-agents-md",
      "ask-what-loads",
      "personal-vs-team",
      "hook-hard-stop",
      "context-ring",
      "open-plan-mode",
      "plan-prompt",
      "review-plan",
      "save-plan",
      "data-model-session",
      "everything-at-once",
      "decompose-skill",
      "read-session-1",
      "build-in-parallel",
      "parallel-build-prompt",
      "watch-task-cards",
      "verify-prompt",
      "download-csv",
      "light-verifier",
      "fallback-branch",
      "resolve-review",
      "project-starter",
      "project-subscription",
      "project-gate-review",
      "project-review-comment",
      "models-per-role",
      "usage-dashboard",
      "fresh-chat",
    ]);

    expect(beat("plan-prompt")?.example).toMatch(/^Plan a tax summary export for TurboTax Expert Ops/);
    expect(beat("plan-prompt")?.example).toContain("GET /api/filers/[id]/tax-summary?year=YYYY");
    expect(beat("plan-prompt")?.example).toContain("exactly four sessions");
    expect(beat("data-model-session")?.example).toMatch(/^Implement only Session 1 \(data model\)/);
    expect(beat("parallel-build-prompt")?.example).toMatch(/^\/multitask Build Sessions 2, 3, and 4/);
    expect(beat("verify-prompt")?.example).toMatch(/^\/turbotax-reviewer /);
    expect(beat("verify-prompt")?.example).toContain("/api/filers/fil_marlow/tax-summary?year=2025");
    expect(beat("verify-prompt")?.example).toContain("PASS, PARTIAL, or FAIL");
    expect(beat("decompose-skill")?.example).toMatch(/^\/plan Use the decompose-feature skill\./);
    expect(beat("light-verifier")?.example).toContain("acceptance-verifier");
    expect(beat("resolve-review")?.example).toBe("/multitask @resolve-review.md");
    expect(beat("project-starter")?.example).toContain(".cursor/plans/tax-summary-export.fallback.md");
    expect(beat("project-starter")?.example).toContain(".cursor/plans/resolve-review.md");
    expect(beat("project-starter")?.example).toContain("Don't merge anything.");
    expect(beat("project-subscription")?.example).toContain("gets a review comment");
    expect(beat("project-gate-review")?.example).toMatch(/^Gate review, one table per PR/);
    expect(beat("project-gate-review")?.example).toContain("PASS, PARTIAL, or FAIL");
    expect(beat("project-review-comment")?.pasteLabel).toBe("Paste as a comment on the CSV export PR");

    for (const entry of beats301) {
      expect(entry.promptType, entry.id).toBeDefined();
      if (entry.promptType === "none") expect(entry.example, entry.id).toBeUndefined();
      else expect(entry.example, entry.id).toBeTruthy();
    }
  });

  it("points every beat at files that exist", () => {
    const pathPattern = /(?:^|[\s(`])((?:\.cursor|app|lib|components|tests)\/[\w./[\]-]+\.(?:md|mdc|ts|tsx))/g;
    for (const entry of beats301) {
      const text = `${entry.detail} ${entry.example ?? ""}`;
      for (const [, path] of text.matchAll(pathPattern)) {
        expect(existsSync(join(root, path)), `${entry.id} cites missing ${path}`).toBe(true);
      }
      for (const [, plan] of text.matchAll(/@([\w.-]+\.md)\b/g)) {
        expect(existsSync(join(root, ".cursor/plans", plan)), `${entry.id} cites missing plan ${plan}`).toBe(true);
      }
    }
    expect(existsSync(join(root, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(root, "app/api/AGENTS.md"))).toBe(true);
  });

  it("only the hook beat trips the synthetic-data hook", () => {
    for (const entry of beats301) {
      if (!entry.example) continue;
      const result = checkPrompt({ prompt: entry.example });
      expect(result.continue, entry.id).toBe(entry.id !== "hook-hard-stop");
    }
  });

  it("lists project agents and skills that exist on disk", () => {
    for (const agent of PROJECT_AGENTS) {
      expect(read(agent.path)).toMatch(new RegExp(`^---\\nname: ${agent.name}\\n`));
    }
    for (const skill of PROJECT_SKILLS) {
      if (skill.path.startsWith("~")) continue;
      expect(read(skill.path)).toMatch(new RegExp(`^---\\nname: ${skill.name}\\n`));
    }
  });
});

describe("docs and context", () => {
  it("keeps AGENTS.md near the deck's 40 lines", () => {
    const body = read("AGENTS.md").split("<!-- END:nextjs-agent-rules -->")[1] ?? "";
    expect(body.trim().split("\n").length).toBeLessThanOrEqual(45);
  });

  it("points docs at /runbooks/301 and agrees on the shipped suite count", () => {
    const docs = {
      readme: read("README.md"),
      howto: read("demo-howto.md"),
      agents: read("AGENTS.md"),
      reviewer: read(".cursor/agents/turbotax-reviewer.md"),
      reset: read(".cursor/skills/reset-demo-state/SKILL.md"),
      script: read("scripts/demo-reset.ts"),
    };

    expect(docs.readme).toContain("/runbooks/301");
    expect(docs.howto).toContain("/runbooks/301");
    expect(docs.agents).toContain("lib/runbooks/meta.ts");
    for (const [name, contents] of Object.entries(docs)) {
      expect(contents, `${name} still mentions a retired name`).not.toMatch(/Ledgerly|Fieldnote Workspace|Grok Build/);
    }

    const counts = new Set<string>();
    for (const [name, contents] of Object.entries(docs)) {
      const matches = [...contents.matchAll(/0 failed \/ (\d+) passed/g)].map((match) => match[1]);
      expect(matches.length, `${name} is missing a "0 failed / <n> passed" count`).toBeGreaterThan(0);
      for (const passed of matches) counts.add(passed);
    }
    counts.add(docs.script.match(/EXPECTED_PASSED = (\d+);/)?.[1] ?? "missing");
    expect(counts.size, `shipped-suite count disagrees: ${[...counts].join(", ")}`).toBe(1);
  });
});
