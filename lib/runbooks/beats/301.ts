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
        detail: "Open a new local agent. Press Shift+Tab to switch to Plan mode, on a frontier model for planning.",
      },
      {
        id: "plan-prompt",
        title: "Plan the tax summary export",
        promptType: "reusable",
        detail:
          "While it researches, narrate what it reads: lib/data.ts, the Prisma schema, the demo clock in lib/clock.ts, and the repo rules.",
        example: [
          "Plan a tax summary export for TurboTax Expert Ops: a tax expert downloads a CSV of one filer's forms and federal withholding for one tax year, through a read-only API at GET /api/filers/[id]/tax-summary?year=YYYY and a control on the return page, with targeted tests.",
          "",
          "Split it into exactly four sessions: 1) data model, 2) API, 3) frontend, 4) tests.",
          "For each session, give: a one-sentence goal, inputs (files to @ and patterns to copy), files likely touched, acceptance criteria I can check, what's out of scope, and what it depends on.",
          "",
          "Draw the dependency graph. The data model comes first. The API and frontend can run in parallel because the route path and query string are fixed above. Tests come after the API.",
          "Follow AGENTS.md and the repo rules. Don't write code yet.",
        ].join("\n"),
      },
      {
        id: "review-plan",
        title: "Review the plan",
        promptType: "none",
        detail:
          "Walk the four sessions, their inputs, acceptance criteria, and the dependency graph. Edit one criterion live — for example, year must be a four-digit tax year no later than 2025, otherwise 400. Review happens here, on one page, before any code exists.",
      },
      {
        id: "save-plan",
        title: "Save the plan",
        promptType: "none",
        detail:
          "Select Save to workspace so the plan lands in .cursor/plans/. If Plan mode goes off script, review .cursor/plans/tax-summary-export.fallback.md instead.",
      },
      {
        id: "data-model-session",
        title: "Start the data model session",
        promptType: "reusable",
        detail: "Start a new chat. This runs while you talk about orchestration; the next demo comes back to it.",
        example: [
          "Implement only Session 1 (data model) from the plan in .cursor/plans/.",
          "Stop when its acceptance criteria are met. Don't touch routes, pages, or tests.",
          "Finish with a checklist of each acceptance criterion: PASS or FAIL, with the file or command that shows it.",
        ].join("\n"),
      },
      {
        id: "everything-at-once",
        title: "Show, don't run: everything at once",
        promptType: "adaptable",
        detail:
          "Put this on screen without running it. It maximizes tokens, turns, and surprises; scoped sessions give you reviewable progress.",
        example:
          "Build the whole tax summary feature end to end, add tests and docs, and clean up anything messy you find along the way.",
      },
      {
        id: "decompose-skill",
        title: "Optional: decomposition as a team skill",
        promptType: "reusable",
        detail:
          "The same decomposition, encoded once in .cursor/skills/decompose-feature/SKILL.md so the prompt shrinks.",
        example:
          "/plan Use the decompose-feature skill. Feature: on the return page, a labeled link downloads the filer's tax summary for one tax year as CSV from GET /api/filers/[id]/tax-summary?year=YYYY. Unknown filer is 404; a bad year is 400. Do not write code yet.",
      },
    ],
  },
  {
    id: "orchestrate",
    title: "How do you orchestrate the work?",
    beats: [
      {
        id: "read-session-1",
        title: "Read the data model checklist",
        promptType: "none",
        detail:
          "Go back to the chat where Session 1 ran and read its PASS/FAIL checklist out loud. If it isn't finished, check out the demo/session-1-done branch.",
      },
      {
        id: "build-in-parallel",
        title: "Build in parallel",
        promptType: "none",
        detail:
          "Open the saved plan and select Build in Parallel. Approving the plan is the gate — nothing else gets written until you click.",
      },
      {
        id: "parallel-build-prompt",
        title: "Fallback: the parallel build prompt",
        promptType: "reusable",
        detail: "Only if the Build in Parallel button is missing.",
        example: [
          "/multitask Build Sessions 2, 3, and 4 from the plan in .cursor/plans/.",
          "Run Sessions 2 and 3 in parallel. Start Session 4 after Session 2 is done.",
          "Each worker stays inside its session and stops at its acceptance criteria.",
          "When all three finish, give me one table: session, files changed, model used, PASS or FAIL.",
        ].join("\n"),
      },
      {
        id: "watch-task-cards",
        title: "Watch the task cards",
        promptType: "none",
        detail:
          "The API and frontend sessions run at the same time, each with its own task card, context, and model. Tests wait for the API. Two agents at once cost about twice the tokens.",
      },
      {
        id: "verify-prompt",
        title: "Verify against acceptance criteria",
        promptType: "reusable",
        detail: "Read the PASS / PARTIAL / FAIL table against the plan's acceptance criteria.",
        example: [
          "/turbotax-reviewer Review the combined diff against the plan in .cursor/plans/.",
          'Then run npm test and curl -sS "http://127.0.0.1:43173/api/filers/fil_marlow/tax-summary?year=2025".',
          "Report PASS, PARTIAL, or FAIL for each acceptance criterion, with evidence. Don't fix anything.",
        ].join("\n"),
      },
      {
        id: "download-csv",
        title: "Download the CSV",
        promptType: "none",
        detail:
          "If time allows, open TY25-1043 for Ellis Marlow at /returns/ret_1043 and select the new download control.",
      },
      {
        id: "light-verifier",
        title: "Optional: a lighter verifier",
        promptType: "reusable",
        detail: "acceptance-verifier writes no code and runs on a cheaper model — slide 25's light verifier.",
        example:
          "Use the acceptance-verifier subagent on the tax summary export plan. Report PASS, PARTIAL, or FAIL for each session's done-when line, with the command you ran and what it returned.",
      },
      {
        id: "fallback-branch",
        title: "Fallback: the finished branch",
        promptType: "none",
        detail:
          "If it is still building near the end of the slot, check out demo/all-sessions-done and walk the diff, the task cards, and the reviewer's report.",
      },
      {
        id: "resolve-review",
        title: "Optional: a second feature that splits",
        promptType: "adaptable",
        detail:
          "The credit review stub splits cleanly: helper, API, and UI each own one file. Run it when the audience wants a second orchestration.",
        example: "/multitask @resolve-review.md",
      },
      {
        id: "project-starter",
        title: "Optional: the same work as a Project",
        promptType: "adaptable",
        detail:
          "Rung three, the day before. In the Agents Window, select Projects > New Project. Name it TurboTax Expert Ops, pick this repository under Workspace and a frontier model under Model, select Create Project, and paste this starter.",
        example: [
          "You're the coordinator for TurboTax Expert Ops, the demo console in this repository. Read AGENTS.md first, and hold every agent to it and to .cursor/rules.",
          "",
          "Deliver two features as separate, reviewable PRs:",
          "1. The tax summary CSV export in .cursor/plans/tax-summary-export.fallback.md.",
          "2. Credit-review resolution in .cursor/plans/resolve-review.md.",
          "",
          "Each plan is the contract. The two plans don't share files, so run them in parallel. Inside a plan, delegate sessions in the order it gives, and run sessions side by side only where it says they can. Give each agent its owned files, the shared contract, and its done-when line.",
          "",
          "Before a PR comes back to me, run turbotax-reviewer on its diff and acceptance-verifier on its plan, and attach both reports. Don't merge anything.",
          "",
          "Record what you learn about setting up, seeding, and testing this repo in the project notes, so the next agent starts with it.",
        ].join("\n"),
      },
      {
        id: "project-subscription",
        title: "Optional: give the Project a subscription",
        promptType: "reusable",
        detail:
          "Before the session, once both PRs are open. Then leave a test comment such as \"Test: no change needed\" on one PR to confirm it fires.",
        example:
          "Follow pull requests in this repository. When one of your two PRs gets a review comment, have the agent that owns those files make the fix, rerun turbotax-reviewer and acceptance-verifier, and report back here with the new verdicts. Don't merge anything.",
      },
      {
        id: "project-gate-review",
        title: "Optional: the gate review",
        promptType: "reusable",
        detail:
          "Live, in the Project. Read one table: each session, its model, its done-when line, and the verifier's verdict. The gate moved to the PR; you review verdicts, not every turn.",
        example:
          "Gate review, one table per PR: the link, each session, the model its agent ran on, its done-when line, and acceptance-verifier's PASS, PARTIAL, or FAIL with the evidence. Under each table, list any High findings from turbotax-reviewer. End with what you need from me before I review the diffs. Don't merge or change anything.",
      },
      {
        id: "project-review-comment",
        title: "Optional: wake it with a review comment",
        promptType: "adaptable",
        pasteLabel: "Paste as a comment on the CSV export PR",
        detail:
          "Leave this on the CSV export PR, then point at the Listening pill. The coordinator wakes on the comment and hands the fix to the agent that owns the file.",
        example: "Add a one-line hint under the download link: One row per form on file, plus a totals row.",
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
