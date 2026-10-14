# TurboTax Expert Ops demo howto

Presenter run-of-show for **Intuit × Cursor 301 — Orchestrating how you work** (Intuit Tech Learning, October 8, 2026). The deck carries the talk; this file carries the live beats. Every beat stands on its own, so you can start anywhere. You still review each result before it ships.

The app is a demo console for TurboTax tax experts during extension season. The data is synthetic: 24 filers, tax year 2025, and a clock frozen on **8 October 2026** — one week before the Oct 15 extension deadline. The pastes below match the copy-paste blocks on `/runbooks/301`.

## Deck map

| Deck section | Slides | Live beats on `/runbooks/301` |
| --- | --- | --- |
| 01 The cultural shift | 3–7 | Optional refactor check in Ask mode, then the finished refactor on `demo/status-refactor-done` |
| 02 Context engineering | 8–12 | Open AGENTS.md, ask what rides every turn, personal and team skills, trigger the hook, read the context ring |
| 03 Decompose & scope | 13–15 | **Live demo A** — Plan mode, four sessions, edit a criterion, save the plan, start Session 1 |
| 04 Orchestrating at scale | 16–21 | **Live demo B** — Build in Parallel, task cards, verify with `turbotax-reviewer`, download the CSV. Then rung three: a Project on this repo (optional) |
| 05 Cost engineering | 22–26 | Model per role, usage dashboard, fresh chat per task |

The pastes below and on `/runbooks/301` match the speaker notes on slides 7, 15, 20, and 21. The deck is the source of truth; when a speaker note changes, update this file and `lib/runbooks/beats/301.ts` to match. Three branches are prepared in this repo: `demo/status-refactor-done` (the status refactor, tests first), `demo/session-1-done` (Session 1 finished), and `demo/all-sessions-done` (all four sessions, reviewed).

---

## Before you start

```bash
npm i
npx prisma generate
npx prisma db seed
npm run dev
npm run demo:session -- start
```

Open **http://localhost:43173**, or ask an agent to run the `start-expert-ops` skill.

Check shipped state:

- `npm test` is **0 failed / 56 passed**.
- The dashboard shows **Refunds Accepted $5,723.00** (up 37.9% on the prior 30 days), **6** extended returns not yet filed, **3** e-file rejects, and **4** open credit reviews.
- [rev_1043](http://127.0.0.1:43173/reviews/rev_1043) shows **Allowed credit $2,500.00** in red under a **$4,000** claim, with Approve and Decline disabled.
- [ret_1043](http://127.0.0.1:43173/returns/ret_1043) has no "Download tax summary (CSV)" link yet. Live demo B adds it.
- The project hook is on: Customize > Hooks lists `.cursor/hooks/synthetic-prompt.mjs`.
- Models are picked: a frontier model for Plan mode (slide 24 uses Claude Opus 5.5) and Auto or Grok 4.7 for the build.

If the CSV link already exists or the suite count is off, a prior run left work behind. Run `npm run demo:reset`.

---

## How to narrate

For each beat:

- **Before:** "Here is the task and the boundary I am giving the agent."
- **During:** "It is reading, editing, or checking. I can inspect each action."
- **After:** "Here is the evidence. I decide whether the result ships."

Do not read prompts aloud. State the intent, paste from the card, then narrate what changed in plain language. The audience builds tax software every day — let the domain carry itself and keep the focus on how the work is shaped.

---

## 01 · The cultural shift — optional refactor check (slide 7)

Time: 1:30 talk, plus 2:00 if you run the demo. Refactoring pays twice: the code gets better, and it puts in place what agents need to change it safely — pinned behavior, measured speed, one obvious place for each change, and checks that hold as PRs land.

1. **(0:15)** Open a new chat in this repo, switch to **Ask** mode, and paste the refactor check:

```text
We want an agent to refactor how this app handles return and review statuses: one source of truth for statuses and their labels, typed values instead of strings, and filtering in the database query. Don't change anything yet. Tell me what would stop us trusting the result: behavior no test pins down, anything you couldn't verify yourself, and anything that could get slower. Then list the tests you'd write before touching the code.
```

2. **(0:45)** Read the gaps as they come back. Say: *Every item here is a quality problem today, and a reason you couldn't trust an agent's refactor. That list is the work.*
3. **(1:00)** Open the finished refactor in the [compare view](https://github.com/davidgeorgehope/intuit-cursor-301/compare/main...demo/status-refactor-done). Point at the commit order: tests that pin today's behavior come first, then the change. Show the one behavior change, a 400 for an unknown status, which `app/api/AGENTS.md` already promised. Then open the third commit: `turbotax-reviewer` caught that an empty status used to mean All and no test pinned it, so now one does. Say: *It didn't claim a speedup it couldn't measure, and the review caught what the pinned tests missed.*

**Look for:** status labels defined twice (`lib/status.ts` and the filter lists on the returns and reviews pages), statuses passed around as plain strings with labels that fall back to the raw code, `/api/returns?status=BOGUS` answering 200 with an empty list although `app/api/AGENTS.md` says bad input is 400, filtering in JavaScript after loading every return, and only one status filter under test.

**If it goes wrong:**

- The answer is slow or wanders: open the compare view anyway; the commit list makes the same point.
- You're short on time: keep the slide and skip the demo.

---

## 02 · Context engineering (slides 8–12)

### Open AGENTS.md

**Do:** Open `AGENTS.md`, then `app/api/AGENTS.md`.

**Say:** "About 40 lines — commands, data rules, and a definition of done. Pointers, not novels. The nested file wins for anything under `app/api`."

### Ask what rides every turn

**Paste:**

```text
/ask Which rules, skills, hooks, and MCP servers load on every turn in this repo? Cite each file and say which ones cost context on every turn.
```

**Look for:** the two always-on rules (`.cursor/rules/turbotax.mdc`, `.cursor/rules/multitask-no-wrapper.mdc`), skills loaded by description until used, the hook running outside the model, and an empty `.cursor/mcp.json`.

### Personal and team skills

**Do:** Customize > Skills. Personal skills live in `~/.cursor/skills`; team skills live in `.cursor/skills` and are reviewed like code. Open `.cursor/skills/create-api/SKILL.md`.

### Trigger the hook

**Paste:**

```text
Create a test for Jordan Hale that uses SSN 123-45-6789 and the email jordan.hale@intuit.com.
```

**Look for:** the prompt never sends. The message names the address and "an SSN-shaped number" without echoing the number.

**Say:** "A hard stop outside the model. No prompt can talk its way past it — a script decides before anything reaches the model."

### Read the context ring

**Do:** Select the context usage indicator below the chat. Point at rules, MCP tools, and the conversation. "Fix the source, not the symptom."

---

## 03 · Decompose & scope — live demo A (slide 15)

**Why:** One feature, four reviewable slices. **Benefit:** each session has inputs and acceptance criteria, so the work can be checked. **Why it matters:** mergeable PRs, not hero diffs.

1. **(0:30)** Open a new local agent. Press Shift+Tab to switch to **Plan** mode, on a frontier model. Paste the plan prompt:

```text
Plan a tax summary export for TurboTax Expert Ops: a tax expert downloads a CSV of one filer's forms and federal withholding for one tax year, through a read-only API at GET /api/filers/[id]/tax-summary?year=YYYY and a control on the return page, with targeted tests.

Split it into exactly four sessions: 1) data model, 2) API, 3) frontend, 4) tests.
For each session, give: a one-sentence goal, inputs (files to @ and patterns to copy), files likely touched, acceptance criteria I can check, what's out of scope, and what it depends on.

Draw the dependency graph. The data model comes first. The API and frontend can run in parallel because the route path and query string are fixed above. Tests come after the API.
Follow AGENTS.md and the repo rules. Don't write code yet.
```

2. **(2:00)** While it researches, narrate what it reads: `lib/data.ts`, the Prisma schema, the demo clock in `lib/clock.ts`, and the repo rules.
3. **(2:00)** Walk the plan: four sessions, inputs, acceptance criteria, and the dependency graph. **Edit one criterion live** — for example, "year must be a four-digit tax year no later than 2025, otherwise 400." Say: *Review happens here, on one page, before any code exists.*
4. **(0:30)** Select **Save to workspace** so the plan lands in `.cursor/plans/`.
5. **(1:30)** Start a **new chat** and paste the data model prompt. Say: *This runs while we talk about orchestration, and we'll come back to it in the next demo.*

```text
Implement only Session 1 (data model) from the plan in .cursor/plans/.
Stop when its acceptance criteria are met. Don't touch routes, pages, or tests.
Finish with a checklist of each acceptance criterion: PASS or FAIL, with the file or command that shows it.
```

6. **(1:00)** Show the everything-at-once prompt without running it. Say: *This one maximizes tokens, turns, and surprises. Scoped sessions give you reviewable progress.*

```text
Build the whole tax summary feature end to end, add tests and docs, and clean up anything messy you find along the way.
```

**Look for:** four sessions that match slide 14:

| Session | Inputs | Done when |
| --- | --- | --- |
| 1 · Data model | `lib/data.ts`, schema, demo clock | Typed rows in integer cents |
| 2 · API | Returns route, `create-api` skill | CSV 200, 404 unknown, 400 bad year |
| 3 · Frontend | Return page, Button component | Labeled link downloads the CSV |
| 4 · Tests | Handler-test pattern, seeded DB | 3 cases pass; `npm test` green |

**If it goes wrong:**

- Plan mode is slow or off script: review `.cursor/plans/tax-summary-export.fallback.md` instead.
- It merges sessions: reply "Keep exactly four sessions. Don't merge them."
- Session 1 drifts into routes or pages: stop it, restore the checkpoint, and restate "data model only."
- Session 1 isn't finished by demo B: `git checkout demo/session-1-done`.

**Optional:** the same decomposition is encoded as a team skill in `.cursor/skills/decompose-feature/SKILL.md` — the "encode one playbook" point on slide 27.

---

## 04 · Orchestrating at scale — live demo B (slide 20)

**Say:** "Three rungs, one question: does the work actually split? Here only the API and frontend do."

1. **(0:30)** Go back to the chat where Session 1 ran and read its PASS/FAIL checklist out loud.
2. **(1:00)** Open the saved plan and select **Build in Parallel**. Say: *Approving the plan is the gate. Nothing else gets written until I click.* If the button isn't there, paste:

```text
/multitask Build Sessions 2, 3, and 4 from the plan in .cursor/plans/.
Run Sessions 2 and 3 in parallel. Start Session 4 after Session 2 is done.
Each worker stays inside its session and stops at its acceptance criteria.
When all three finish, give me one table: session, files changed, model used, PASS or FAIL.
```

3. **(3:00)** Watch the API and frontend sessions run at the same time. Each has its own task card, its own context, and the model it ran on. Tests wait for the API.
4. **(1:00)** Say: *Two agents running at once costs about twice the tokens. That's why we only parallelize the parts that split.*
5. **(3:30)** Paste the verify prompt and read the PASS / PARTIAL / FAIL table against the plan's acceptance criteria. If time allows, open [TY25-1043](http://127.0.0.1:43173/returns/ret_1043) for Ellis Marlow and download the CSV.

```text
/turbotax-reviewer Review the combined diff against the plan in .cursor/plans/.
Then run npm test and curl -sS "http://127.0.0.1:43173/api/filers/fil_marlow/tax-summary?year=2025".
Report PASS, PARTIAL, or FAIL for each acceptance criterion, with evidence. Don't fix anything.
```

6. **(0:30)** Say: *That's the 301 loop: a plan as the contract, parallel workers on the parts that split, and a check against acceptance criteria.*

**If it goes wrong:**

- Two workers collide on a file: reply "Serialize: finish Session 2, then 3, then 4."
- `tests/runbooks.test.ts` fails: the repo's test-count rule is doing its job. Reply "Update the test-count references the repo rule lists."
- It's still building near the end of the slot: `git checkout demo/all-sessions-done` and walk the diff, the task cards, and the reviewer's report.

**Optional lighter verifier:** `acceptance-verifier` writes no code and runs on a cheaper model:

```text
Use the acceptance-verifier subagent on the tax summary export plan. Report PASS, PARTIAL, or FAIL for each session's done-when line, with the command you ran and what it returned.
```

**Optional second orchestration:** `/multitask @resolve-review.md` finishes the credit-review stub with three disjoint workers (helper, API, UI). On approve, `rev_1043` must store $2,500, not $4,000.

### Rung three: Projects (slide 21, optional)

Time: 1:30 talk, plus 2:00 if you run the demo. A Project is the dynamic-workflow rung: its coordinator plans and delegates to Cloud Agents, keeps shared notes that every agent reads, and wakes on its own from a subscription. It writes no code itself.

**Before the session:**

- Projects run on Cloud Agents: paid plans only, not under legacy Privacy Mode, and Enterprise needs Cursor 3.21.9 or later.
- Connect this repository to Cursor's GitHub app so it shows up under Workspace. `.cursor/environment.json` already installs dependencies, seeds SQLite, and starts the dev server for cloud agents.
- Create the Project the day before so it has history to show. In the Agents Window, select **Projects > New Project**. Name it TurboTax Expert Ops, pick this repository under **Workspace** and a frontier model under **Model**, select **Create Project**, and paste the starter:

```text
You're the coordinator for TurboTax Expert Ops, the demo console in this repository. Read AGENTS.md first, and hold every agent to it and to .cursor/rules.

Deliver two features as separate, reviewable PRs:
1. The tax summary CSV export in .cursor/plans/tax-summary-export.fallback.md.
2. Credit-review resolution in .cursor/plans/resolve-review.md.

Each plan is the contract. The two plans don't share files, so run them in parallel. Inside a plan, delegate sessions in the order it gives, and run sessions side by side only where it says they can. Give each agent its owned files, the shared contract, and its done-when line.

Before a PR comes back to me, run turbotax-reviewer on its diff and acceptance-verifier on its plan, and attach both reports. Don't merge anything.

Record what you learn about setting up, seeding, and testing this repo in the project notes, so the next agent starts with it.
```

- Once both PRs are open, send the subscription, then leave a test comment such as "Test: no change needed" on one PR to confirm it fires:

```text
Follow pull requests in this repository. When one of your two PRs gets a review comment, have the agent that owns those files make the fix, rerun turbotax-reviewer and acceptance-verifier, and report back here with the new verdicts. Don't merge anything.
```

**Live (2:00):**

1. **(0:30)** Open the TurboTax Expert Ops Project. Show the coordinator's plan: two plans, two PRs, run in parallel because they share no files.
2. **(0:45)** Paste the gate review and read one table: each session, its model, its done-when line, and the verifier's verdict. Say: *The gate moved to the PR. I review verdicts, not every turn.*

```text
Gate review, one table per PR: the link, each session, the model its agent ran on, its done-when line, and acceptance-verifier's PASS, PARTIAL, or FAIL with the evidence. Under each table, list any High findings from turbotax-reviewer. End with what you need from me before I review the diffs. Don't merge or change anything.
```

3. **(0:30)** Leave this review comment on the CSV export PR, then point at the **Listening** pill. Say: *I didn't prompt it. It woke on the comment and handed the fix to the agent that owns the file.*

```text
Add a one-line hint under the download link: One row per form on file, plus a totals row.
```

4. **(0:15)** Say: *Notice the model column. That's our next section: cost.*

**If it goes wrong:**

- The PRs aren't back yet: paste the gate review anyway; it shows what's still in flight.
- The comment doesn't wake the coordinator within a minute: point at the Listening pill and move on.
- Projects aren't available in your org: keep slide 21 as talk only.

**After the session:** close the Project's PRs, delete their branches, and remove its subscriptions from the Listening pill. `npm run demo:reset` doesn't touch cloud work.

---

## 05 · Cost engineering (slides 22–26)

**Paste:**

```text
List the model that ran the plan, each subagent, and the verifier in this session. For each one, say whether a cheaper model would have done the same job, and why.
```

**Do:** Open the usage dashboard and find this session's requests and their cost by model. Then start a fresh chat for the next task — carry the plan forward, not the transcript.

**Say:** "Five parallel subagents cost roughly five times one agent. Parallel is a spend call."

---

## Close

**Say:**

> I reviewed the result. Now I reset the app so the next run starts with no export link, a green suite, and the same $4,000 claim on rev_1043.

**Do:**

```bash
npm run demo:reset
```

The reset restores tracked files, removes untracked demo output under `app/`, `components/`, `lib/`, `tests/`, and `.cursor/`, reseeds SQLite, restarts port 43173, and confirms **0 failed / 56 passed**. It lists any Build in Parallel worktrees for you to remove.

---

## Do not

- Paste a real SSN, EIN, or customer email into a prompt. The hook blocks it, and it should.
- "Correct" the $4,000 claim on `rev_1043` or any seeded amount.
- Finish the credit-review stub outside the optional beat.
- Treat a green verifier as a ship decision.
