import type { DemoSection } from "@/lib/runbooks/types";

export const RUNBOOK_SECTIONS_401 = [
  {
    id: "recap",
    title: "What did 301 leave you with?",
    beats: [
      {
        id: "codebase-is-memory",
        title: "The codebase is the memory",
        promptType: "reusable",
        detail:
          "Ask mode. The point of the recap: rules, skills, and tests are the context, not the transcript.",
        example:
          "Read AGENTS.md, .cursor/rules/turbotax.mdc, and .cursor/skills/create-api/SKILL.md. Which of these ride every turn, and which load only when the task matches? Don't edit anything.",
      },
      {
        id: "verification-beats-a-skill",
        title: "A check beats a reminder",
        promptType: "none",
        detail:
          "Open .cursor/skills/verify-expert-ops/SKILL.md. The skill tells the agent to run the app. The script, the unit tests, and the linter are what actually fail.",
      },
    ],
  },
  {
    id: "verification",
    title: "Verification first",
    beats: [
      {
        id: "one-command-ladder",
        title: "One command for the lower rungs",
        promptType: "none",
        detail: "npm run check runs typecheck, lint, and unit tests. npm run verify drives the app on port 43173.",
      },
      {
        id: "drive-the-app",
        title: "Drive the rejects queue",
        promptType: "reusable",
        detail: "Use the verify-expert-ops skill. It should hit the running app, not a mock.",
        example:
          "Use the verify-expert-ops skill. Prove the rejects feature in .cursor/skills/verify-expert-ops/features/rejects.md against http://127.0.0.1:43173. Report each check as PASS or FAIL with the evidence file. Don't change product code.",
      },
    ],
  },
  {
    id: "skill-evals",
    title: "Does this skill still earn its place?",
    beats: [
      {
        id: "local-rubric",
        title: "Score the recorded arms",
        promptType: "none",
        detail:
          "npm run eval:skills grades .cursor/skills/draft-filer-message/evals/evals.json and writes a benchmark table. It spends no tokens. A live judge uses grader.md.",
      },
      {
        id: "judge-on-a-stronger-model",
        title: "Judge on a stronger model",
        promptType: "reusable",
        detail:
          "skill-judge is readonly and uses a stronger model family than mission-worker. It reads grader.md and sees arm labels only.",
        example:
          "/skill-judge Grade eval 1 under .cursor/skills/draft-filer-message/evals/runs using .cursor/skills/draft-filer-message/evals/grader.md. Call the outputs arm-a and arm-b. Don't edit files.",
      },
    ],
  },
  {
    id: "hooks-guardrails",
    title: "Hooks and guardrails",
    beats: [
      {
        id: "deny-shell",
        title: "Deny a force-push",
        promptType: "reusable",
        detail: "The shell hook returns deny. Ask is the wrong permission, and preToolUse does not enforce ask.",
        example:
          "Run git push --force origin main and tell me what the shell hook returned. Don't work around it.",
      },
      {
        id: "protected-write",
        title: "Leave the tax-year file alone",
        promptType: "reusable",
        detail: "preToolUse denies a write to lib/tax-year.ts. The seed is on the same list.",
        example: "Change the extension deadline in lib/tax-year.ts to 16 October 2026. If a hook blocks you, stop and quote it.",
      },
      {
        id: "fail-closed",
        title: "See failClosed before you arm it",
        promptType: "none",
        detail:
          "Read .cursor/hooks/README.md. Arming missions/fail-closed-armed blocks shell commands. Delete the file to recover. Don't arm it on the 301 path.",
      },
    ],
  },
  {
    id: "missions-loops",
    title: "Missions and agent loops",
    beats: [
      {
        id: "arm-the-mission",
        title: "Arm extension-pace",
        promptType: "none",
        detail:
          "In a terminal: npm run mission:plant, then npm run mission:arm -- extension-pace. The stop hook follows up at most 3 times.",
      },
      {
        id: "goal-until-the-test-passes",
        title: "Give it a goal",
        promptType: "reusable",
        detail: "/goal keeps the objective. The stop hook is the loop. Restore with npm run mission:restore if you need the fallback.",
        example:
          "/goal Fix the extension-pace mission in missions/extension-pace/MISSION.md. Run its done-when command. Stop when it exits 0. Do not edit lib/tax-year.ts or the seed.",
      },
    ],
  },
  {
    id: "harness-cost",
    title: "Harness, fleet, and cost",
    beats: [
      {
        id: "dry-run-stream",
        title: "Stream a mission without a model",
        promptType: "none",
        detail:
          "npm run harness:mission prints stream-json and costUsd 0. npm run harness:compare shows the syntax check against the unit test. --cli and --sdk are the paths that spend tokens; the scripts refuse to launch them.",
      },
      {
        id: "readonly-reviewer",
        title: "A read-only reviewer",
        promptType: "reusable",
        detail: "turbotax-reviewer and skill-judge are readonly. mission-worker is not. Shell subagents are denied.",
        example:
          "/turbotax-reviewer Review the diff for the extension-pace fix. Run the extension-pace test. Report findings. Don't edit files.",
      },
    ],
  },
] as const satisfies readonly DemoSection[];
