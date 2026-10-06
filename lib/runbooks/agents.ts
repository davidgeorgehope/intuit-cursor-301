export const PROJECT_AGENTS = [
  {
    name: "turbotax-reviewer",
    path: ".cursor/agents/turbotax-reviewer.md",
    when: "After any code change. Read-only check that the work exists and runs, then tax-year limits, synthetic filers, protected paths, and high-risk changes.",
  },
  {
    name: "acceptance-verifier",
    path: ".cursor/agents/acceptance-verifier.md",
    when: "Finish line for a plan. Runs each done-when line and reports PASS, PARTIAL, or FAIL with evidence. Writes no product code.",
  },
  {
    name: "api-instrumenter",
    path: ".cursor/agents/api-instrumenter.md",
    when: "/multitask worker. Add the request-log helper to one named API route and nothing else.",
  },
] as const;

export const PROJECT_SKILLS = [
  {
    name: "choose-cursor-workflow",
    path: ".cursor/skills/choose-cursor-workflow/SKILL.md",
    when: "Walk the 301 track, then choose the mode, model, rule, or skill from the shape of the work.",
  },
  {
    name: "decompose-feature",
    path: ".cursor/skills/decompose-feature/SKILL.md",
    when: "Split one feature into scoped sessions, each with inputs and a done-when line.",
  },
  {
    name: "create-api",
    path: ".cursor/skills/create-api/SKILL.md",
    when: "Add one HTTP route: lib/ helper, app/api handler, Vitest on the handler.",
  },
  {
    name: "dispatch-subagents",
    path: ".cursor/skills/dispatch-subagents/SKILL.md",
    when: "Many independent pieces. Launch Task subagents in one parallel turn.",
  },
  {
    name: "hand-to-cloud-agent",
    path: ".cursor/skills/hand-to-cloud-agent/SKILL.md",
    when: "Cloud /goal, /autopilot PR supervision, or an /orchestrate planner tree.",
  },
  {
    name: "autopilot",
    path: "~/.cursor/skills-cursor/autopilot/SKILL.md",
    when: "Built-in skill for the former /babysit PR workflow.",
  },
  {
    name: "automate",
    path: "~/.cursor/skills-cursor/automate/SKILL.md",
    when: "Open the Cursor Automations editor with a reviewed event- or schedule-driven draft.",
  },
] as const;
