import type { DemoSection } from "@/lib/runbooks/types";

export const RUNBOOK_SECTIONS_301 = [
  {
    id: "context-engineering",
    title: "How do you engineer context?",
    beats: [
      {
        id: "open-agents-md",
        title: "Open AGENTS.md",
        promptType: "none",
        detail:
          "Open AGENTS.md. It is about 40 lines: commands, pointers, and a definition of done. Then open app/api/AGENTS.md — the nested file wins for anything under app/api.",
      },
      {
        id: "ask-what-loads",
        title: "Ask what rides every turn",
        promptType: "reusable",
        detail: "Use Ask mode. The answer should cite the always-on rule, the hook, and the empty project MCP map.",
        example:
          "/ask Which rules, skills, hooks, and MCP servers load on every turn in this repo? Cite each file and say which ones cost context on every turn.",
      },
      {
        id: "personal-vs-team",
        title: "Personal and team skills",
        promptType: "none",
        detail:
          "Go to Customize > Skills. Personal skills live in ~/.cursor/skills and follow you. Team skills live in .cursor/skills and are reviewed like code. Open .cursor/skills/create-api/SKILL.md.",
      },
      {
        id: "hook-hard-stop",
        title: "Trigger the hook",
        promptType: "reusable",
        detail:
          "Hooks are hard stops outside the model. The project hook blocks this prompt before it is sent: an SSN-shaped number and an address outside .example.",
        example: "Create a test for Jordan Hale that uses SSN 123-45-6789 and the email jordan.hale@intuit.com.",
      },
      {
        id: "context-ring",
        title: "Read the context ring",
        promptType: "none",
        detail:
          "Select the context usage indicator below the chat. Point at rules, MCP tools, and the conversation. Fix the source, not the symptom.",
      },
    ],
  },
  {
    id: "decompose-scope",
    title: "How do you decompose a feature?",
    beats: [
      {
        id: "open-plan-mode",
        title: "Open a new agent in Plan mode",
        promptType: "none",
        detail: "Open a new agent. Switch to Plan mode and pick a frontier model for planning.",
      },
      {
        id: "decompose-export",
        title: "Decompose the tax summary export",
        promptType: "reusable",
        detail:
          "The decompose-feature skill turns one feature into scoped sessions, each with inputs and a done-when line.",
        example:
          "/plan Use the decompose-feature skill. Feature: on the return page, a labeled link downloads the filer's tax summary for one tax year as CSV. The year comes from ?year=. Unknown filer is 404; a bad year is 400. Do not write code yet.",
      },
      {
        id: "review-session-cards",
        title: "Review the session cards",
        promptType: "none",
        detail:
          "Check each card: inputs are @-pointers, the done-when line is something you can run or click, and each session owns its own files. Data model first; API and frontend after it; tests last.",
      },
      {
        id: "save-plan",
        title: "Save the plan",
        promptType: "none",
        detail:
          "Save the plan to the workspace. If the live plan goes sideways, open .cursor/plans/tax-summary-export.fallback.md — the same four sessions.",
      },
    ],
  },
  {
    id: "orchestrate",
    title: "How do you orchestrate the work?",
    beats: [
      {
        id: "approve-gate",
        title: "Approve at the gate",
        promptType: "none",
        detail: "The plan is the contract. Approving it is the single gate — nothing writes code before it.",
      },
      {
        id: "build-in-parallel",
        title: "Build in parallel",
        promptType: "none",
        detail:
          "Select Build in Parallel. The data model runs first; the API and frontend sessions run side by side in their own worktrees; tests run last.",
      },
      {
        id: "watch-task-cards",
        title: "Watch the task cards",
        promptType: "none",
        detail:
          "Open each subagent's task card. Note the model and the files each one touched. Sibling sessions should not overlap.",
      },
      {
        id: "verify-acceptance",
        title: "Verify against acceptance criteria",
        promptType: "reusable",
        detail: "The verifier writes no code. It runs each done-when line and reports PASS, PARTIAL, or FAIL with evidence.",
        example:
          "Use the acceptance-verifier subagent on the tax summary export plan. Report PASS, PARTIAL, or FAIL for each session's done-when line, with the command you ran and what it returned.",
      },
      {
        id: "review-diff",
        title: "Run the reviewer",
        promptType: "reusable",
        detail: "A read-only critic checks the combined diff against the repo's high-risk list.",
        example: "turbotax-reviewer check my work",
      },
      {
        id: "fallback-multitask",
        title: "Fallback: /multitask the plan",
        promptType: "adaptable",
        detail:
          "If Build in Parallel is not available, the coordinator launches one worker per session from the plan file.",
        example: "/multitask @tax-summary-export.fallback.md",
      },
      {
        id: "resolve-review",
        title: "Optional: a second feature that splits",
        promptType: "adaptable",
        detail:
          "The credit review stub splits cleanly: helper, API, and UI each own one file. Run it when the audience wants a second orchestration.",
        example: "/multitask @resolve-review.md",
      },
    ],
  },
  {
    id: "cost-engineering",
    title: "How do you spend tokens on purpose?",
    beats: [
      {
        id: "models-per-role",
        title: "Match the model to the role",
        promptType: "reusable",
        detail: "Plan on a frontier model, build on a fast one, and keep noisy subagents on a smaller tier.",
        example:
          "List the model that ran the plan, each subagent, and the verifier in this session. For each one, say whether a cheaper model would have done the same job, and why.",
      },
      {
        id: "usage-dashboard",
        title: "See what it cost",
        promptType: "none",
        detail: "Open the usage dashboard. Find this session's requests and their cost by model.",
      },
      {
        id: "fresh-chat",
        title: "Start fresh for the next task",
        promptType: "none",
        detail: "Start a new chat for the next task. Carry the plan forward, not the transcript.",
      },
    ],
  },
] as const satisfies readonly DemoSection[];
