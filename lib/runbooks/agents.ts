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
  {
    name: "skill-judge",
    path: ".cursor/agents/skill-judge.md",
    when: "Read-only judge for a skill eval. Stronger model than the worker. Grades outputs, does not edit.",
  },
  {
    name: "mission-worker",
    path: ".cursor/agents/mission-worker.md",
    when: "Implements one armed mission until its done-when command passes or the follow-up budget is spent.",
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
  {
    name: "verify-expert-ops",
    path: ".cursor/skills/verify-expert-ops/SKILL.md",
    when: "Drive the running console on port 43173 and prove a feature from the map.",
  },
] as const;
