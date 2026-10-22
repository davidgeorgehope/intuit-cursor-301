# Cursor 401 runbook

Presenter notes for **Cursor 401: From orchestrating to autonomous with oversight**. The 301 console still works. This file is the 401 track. Paste cards also live on `/runbooks/401`.

Every demo runs in the local Cursor IDE or CLI. No beat needs Projects, Automations, or cloud agents.

The deck is the talk. This file is the commands, the expected output, the timing, and the fallback.

## Pre-flight

Do this once on the laptop before anyone is in the room. The app does not fetch a font at runtime. `prisma generate` uses the JavaScript engine in `prisma.config.ts` and does not download `binaries.prisma.sh`. `npm install` still needs the npm registry, for `better-sqlite3` as well as the rest of the app.

| Check | Command | Pass looks like |
| --- | --- | --- |
| Node 20 or newer | `node -v` | `v20` or `v22` |
| Branch | `git checkout main` | The 401 demos. 301 fallbacks are archived as tags: `archive/status-refactor-done`, `archive/session-1-done`, `archive/all-sessions-done`. Check one out with `git checkout <tag>`. |
| Install | `npm install` | Finishes without a registry error |
| Client | `npx prisma generate` | `Generated Prisma Client` |
| Seed | `npx prisma db seed` | `24 filers` and `24 returns`. A warning that the schema `url` is unused is expected. The adapter path is `prisma/dev.db`. |
| Suite | `npm test` | `0 failed / 61 passed` |
| App | `npm run dev` | Ready on port 43173. Open http://127.0.0.1:43173/rejects and see `7 days left`. |
| Hooks | Customize, Hooks, in a trusted window | `.cursor/hooks.json` is listed. If an edit does not show up, start a new chat, then restart Cursor. |

Loop fallback, on this same branch, not a second checkout: `npm run mission:restore` and `npm run mission:disarm`. That puts `lib/extension-pace.ts` back. Do not leave `missions/fail-closed-armed` in place.

Offline skill replay is `npm run eval:skills`. It cannot catch a prune that only fails when a model writes a new message. Use `npm run eval:skills -- --live` and `npm run eval:trigger -- --live` when you want that check. Both call `cursor-agent` and spend tokens. The CLI has to be logged in (`agent login` or `CURSOR_API_KEY`).

## Deck map

| Deck | Demo | Time | Command |
| --- | --- | --- | --- |
| 1. Recap of 301 | Codebase is the memory | 2 min | Ask-mode paste on `/runbooks/401` |
| 2. Verification first | `npm run check`, then `npm run verify` | 4 min | both commands |
| 3. Evaluating skills | With/without and the prune | 4 min | `npm run eval:skills` |
| 4. Hooks and guardrails | Deny, format, stop, failClosed | 5 min | `node scripts/hooks-smoke.mjs` |
| 5. Missions and loops | Plant, arm, `/goal` | 6 min | `npm run mission:plant` |
| 6. Harness, fleet, cost | Real mission run, ready vs bare | 4 min | `npm run harness:mission -- --cli` |

## Before you start

The pre-flight table above is the checklist. `npm run check` is typecheck, lint, and the 56 tests.

Leave the 301 hook in place. The 401 hooks are added beside it in `.cursor/hooks.json`. Hooks load when the workspace is trusted. If a hooks edit does not show up in Customize, start a new chat. The docs say `hooks.json` reloads on save; the Intuit incident needed a restart. Do both if the first is not enough.

Do not put these hooks in `~/.cursor/hooks.json`.

## 1. Recap of 301

**Say:** The codebase is the memory. A skill that the agent cannot check is a reminder.

**Do:** New chat, Ask mode, paste the recap card from `/runbooks/401`.

**Look for:** always-on rules versus skills that load when the description matches. The verify skill is named as something that runs a command.

**If it goes wrong:** Open `AGENTS.md` and `.cursor/skills/verify-expert-ops/SKILL.md` yourself. The point does not need the model's answer.

## 2. Verification first

**Say:** Tests, lint, and types are the ladder. The skill is the instruction to climb it, including the running app.

**Do:**

```bash
npm run check
npm run verify
```

**Look for:** `check` ends with the suite line. `verify` prints three PASS lines:

```text
PASS returns-api: HTTP 200, <n> returns, no SSN-shaped number
PASS rejects: HTTP 200, heading present, 7 days left
PASS credit-review: HTTP 200, allowed credit $2,500.00 under a $4,000.00 claim
evidence: artifacts/verify-expert-ops
```

The feature map is `.cursor/skills/verify-expert-ops/features/`. Each file has the same four sections: what it is, how a person gets there, how to drive it, what usually lies.

**If it goes wrong:** If verify says the server is not answering, `npm run dev` is not up. Start it and rerun. If rejects says 6 days, a previous loop left the planted bug. `npm run mission:restore`.

**Fallback:** `curl -sS http://127.0.0.1:43173/rejects | head` and point at `7 days left`.

## 3. Evaluating skills

**Say:** A skill earns its place when the same prompt does worse without it. Cut lines only when the pass rate holds. The offline replay grades recorded messages. It cannot catch a prune that only fails when a model writes a new one. The live command does that, and it spends tokens. The judge is a different model family from the worker, and it sees arm labels only.

The shape follows the public pstack plugin (MIT): a skill directory, `evals/evals.json` with a prompt and assertions, and a grader. pstack itself ships the eval playbook, not a runner. This repo's runner is local and spends no tokens. Public cuts that used the same rule: [08bd59b](https://github.com/cursor/plugins/commit/08bd59b), [00b14f1](https://github.com/cursor/plugins/commit/00b14f1), [b0b9c7a](https://github.com/cursor/plugins/commit/b0b9c7a).

**Do:**

```bash
npm run eval:skills
```

**Look for:**

```text
| with skill | 6/6 | 100% |
| without skill | 1/6 | 17% |
Prune: 48 lines -> 30 lines. Pass rate 100% -> 100%. Keep the cut.
tokens: 0 (offline grader; a model judge spends tokens)
trigger evals: 4 queries, none executed
```

Open `.cursor/skills/draft-filer-message/evals/evals.json` for the prompts, and `grader.md` for the judge. The recorded arms are `evals/runs/with-skill` and `evals/runs/without-skill`. The verbose skill is `evals/snapshots/verbose/SKILL.md`.

**When to use which.** Default `npm run eval:skills` on stage. It is the recorded arms. Use `--live` in a rehearsal when you changed the skill text and need a new model to write the messages. The worker model is `composer-2.5`. The judge model is `claude-opus-5`. Confirm both on the Intuit plan.

```bash
npm run eval:skills -- --live
npm run eval:trigger -- --live
```

`--live` prints a token warning, then calls `cursor-agent -p`. It writes new arms under `artifacts/skill-evals/live/` and does not replace the recorded ones. A crash is `passed: null`, not a failure of the negative queries.

**Trigger plan, no tokens.** `npm run eval:trigger` writes `passed: null` for every query.

```bash
cursor-agent -p --output-format stream-json --trust --mode ask "Draft the message Avery Quinn would send Remy and Ana Sato about return TY25-1042."
```

Count it as triggered only if the stream shows a read of `SKILL.md`. The public output-format doc does not name that event field. Near-miss queries are in `trigger-queries.json`. "What does IND-032-04 mean?" should not load the skill.

**Live judge, spends tokens.** New chat:

```text
/skill-judge Grade eval 1 under .cursor/skills/draft-filer-message/evals/runs using .cursor/skills/draft-filer-message/evals/grader.md. Call the outputs arm-a and arm-b. Don't edit files.
```

`skill-judge` is readonly, `model: claude-opus-5[effort=high]`. `mission-worker` is `composer-2.5`. Confirm those ids on the Intuit plan. Cursor falls back if one is not.

**If it goes wrong:** The local command is the demo. Skip the live judge and the trigger run.

**Fallback:** Open `evals/runs/with-skill/1.txt` and `evals/runs/without-skill/1.txt`. One names IND-032-04. The other has an exclamation mark and the word SSN.

## 4. Hooks and guardrails

**Say:** A hook is code, outside the model. Deny beats ask beats allow. Exit code 2 blocks. Anything else fails open unless `failClosed` is set.

**Do:**

```bash
node scripts/hooks-smoke.mjs
```

**Look for:** force-push `permission` deny, `npm test` allow, a write to `lib/tax-year.ts` deny, a shell subagent deny, and the unarmed failClosed probe allow with exit 0.

Then, in a new Agent chat, paste the force-push card. The shell hook should block it. Paste the tax-year card. `preToolUse` should deny. It returns deny, not ask. The docs say `preToolUse` accepts ask and does not enforce it.

**failClosed, optional, do this last.** It will block agent shell commands:

```bash
touch missions/fail-closed-armed
```

Ask the agent to run `npm test`. The probe exits 1 and `failClosed` blocks. Recover:

```bash
rm missions/fail-closed-armed
```

The arm file is read on each command. If you instead edit `hooks.json` and the old behavior sticks, start a new chat and restart Cursor.

**If it goes wrong:** The smoke script is the proof the scripts decide correctly. The IDE firing the event is separate. Check Customize, Hooks. If the IDE tool name for an edit is not `Write`, `Delete`, `StrReplace`, or `EditNotebook`, the protected-path hook will not see that edit. Say so. Do not pretend it fired.

**Fallback:** `node scripts/hooks-smoke.mjs` and `.cursor/hooks/README.md`.

## 5. Missions and agent loops

**Say:** A mission has an outcome, a done-when command, a stop, and an escalation. `/goal` holds the outcome. The stop hook is the loop, in the same order as the public ralph-loop plugin: no state file means stop, a pass clears the state, a failure sends one follow-up until the cap.

**Do,** in a terminal, not in the agent:

```bash
npm run mission:plant
npm test -- tests/extension-pace.test.ts
npm run mission:arm -- extension-pace
```

The extension-pace test fails. The page would say 6 days left.

New Agent chat. Paste the `/goal` card from `/runbooks/401`. The stop hook runs the done-when command when the agent stops. On failure it submits a follow-up, at most 3 (`loop_limit` is 3). On the fourth stop it writes `missions/escalation.md` and does not follow up.

`/loop` is the built-in recurring skill. Pair it with `/goal` only if you want a timed tick. This mission does not need a timer. The stop hook is the loop. `/goal` is rolling out. If the slash command is missing, paste the goal text without the slash. The hook still runs.

**Look for:** the agent edits `lib/extension-pace.ts`, the test exits 0, and the hook stops following up.

**If it goes wrong:**

```bash
npm run mission:restore
npm run mission:disarm
```

Show the restored test passing. That is the fallback. Do not leave the plant in the tree.

**Subagents.** `mission-worker` may edit. `skill-judge` and `turbotax-reviewer` are readonly. A shell subagent is denied so the command stays on the parent, where the shell hook can see it.

## 6. Harness, fleet, and cost

**Say:** Headless is `agent -p "<prompt>" --output-format streaming-json` (unified Grok Build CLI; old Cursor CLI: `cursor-agent -p --output-format stream-json --force --trust`). Dollars come from usage, not from the token count. `npm run harness:mission` with no flag is an offline dry-run: it simulates the stream and costs $0. `--cli` and `--sdk` are real.

**Do:**

```bash
npm run harness:mission
npm run harness:compare
```

**Look for:** one JSON object per line, `costUsd` 0, then a before/after:

```text
mission: extension-pace
  before (node --experimental-strip-types --check): PASS
  after (npm test -- tests/extension-pace.test.ts): PASS
  costUsd: 0
```

On a clean tree both pass. To show the gap, plant first. Syntax still passes. The unit test fails. Restore after.

```bash
npm run mission:plant
npm run harness:compare
npm run mission:restore
```

**Real runs (spend tokens).** Plant first, then let a real agent work the mission. The harness runs done-when itself after the agent stops.

```bash
npm run mission:plant
npm run harness:mission -- --cli     # agent CLI (unified or cursor-agent, auto-detected), then done-when
npm run mission:plant
npm run harness:mission -- --sdk     # @cursor/sdk local runtime, loops on done-when
npm run mission:restore
```

Verified 21 Oct 2026 (composer-2.5): `--cli` ended `"doneWhenExit":0,"ranTests":true,"toolCalls":7,"totalTokens":112131`. `--sdk` ended `"passed":true,"turns":1,"totalTokens":92032`. Logs: `fallback/harness-mission/`.

SDK one-offs: `npm run sdk:readonly` (disallowedTools, tokens and cost per run), `npm run sdk:steer` (run.steer mid-run), `npm run sdk:mission`. See `scripts/sdk/README.md`. `agent.getUsage()` returned `feature_unavailable` for local agents on this account, so dollars come from the usage dashboard (SDK tag). Never pass `cloud`. Intuit's unattended runs go through AAP.

**Agent-ready vs bare (spends tokens, about 2 minutes):**

```bash
npm run harness:ready-vs-bare
```

Same prompt, same model, run on a bare copy (code only, cold) and on this repo (AGENTS.md, rules, skills, hooks, armed mission, warm `node_modules`). A hidden test grades both. Three recorded runs are in `fallback/ready-vs-bare/README.md`: both fixed it 3/3; only the ready copy proved it with the test (3/3 vs 0/3) and it used fewer tool calls each time.

A bot or service account holds `CURSOR_API_KEY` for a real SDK run. Do not paste the key into a prompt. The subagent hook denies a task that contains one.

**If it goes wrong:** `npm run harness:mission` (dry-run, labeled as simulated) plus the recorded files in `fallback/`. Say they are recordings.

## What was checked against the docs

Fetched 14 October 2026:

- https://cursor.com/docs/hooks — event names, exit code 2, `failClosed`, `loop_limit`, `followup_message`, `preToolUse` ask not enforced, `subagentStart` ask treated as deny, deny beats ask beats allow.
- https://cursor.com/docs/subagents — `.cursor/agents/*.md`, `model`, `readonly`, `is_background`.
- https://cursor.com/docs/agent/overview — `/goal` is rolling out. `/loop` is the recurring skill.
- https://cursor.com/docs/cli/using — `-p` / `--print`, `--output-format`, `--mode`.
- https://cursor.com/docs/api/sdk/typescript (re-checked 21 Oct 2026, @cursor/sdk 1.0.40) — local `Agent.create({ apiKey, model, disallowedTools, local: { cwd } })`, `run.stream()`, `run.steer()` (local only), `result.usage`, `agent.getUsage()` (local usage gated per account).

Rehearsed on this branch after the font and Prisma changes: `npx prisma generate` (no `binaries.prisma.sh` download), `npx prisma db seed` (24 filers), `npm test` and `npm run check` at 0 failed / 61 passed, `npm run verify` with three PASS lines, both pages HTTP 200, `npm run eval:skills`, `npm run eval:trigger`, both `--live` commands (they stop before a model call because `cursor-agent` is not installed here), hook smoke, failClosed exit 1 while armed, the planted stop-hook follow-up, restore, and both harness commands at costUsd 0.

Not confirmed, because they need the IDE or a logged-in CLI:

- That Customize shows each new hook after a reload.
- That `/goal` is available on the Intuit build.
- A live `agent -p` or SDK run, and a real dollar figure from `getUsage()`.
- The model ids `claude-opus-5[effort=high]` and `composer-2.5` on the Intuit plan. They are the ids in the docs examples.

Skill, eval, verification, and loop shapes follow the public pstack and ralph-loop plugins in https://github.com/cursor/plugins (MIT, https://github.com/cursor/plugins/blob/main/pstack/LICENSE). This repo does not copy those skill bodies. pstack ships an eval playbook and no `evals/` runner; the grader here is the offline stand-in.

## Reset

`npm run mission:restore` and `npm run mission:disarm` if a loop was armed. Then `npm run demo:reset` for the 301 cleanup. Do not arm `missions/fail-closed-armed` and walk away.
