# TurboTax Expert Ops demo howto

Presenter run-of-show for **Intuit × Cursor 301 — Orchestrating how you work** (Intuit Tech Learning, October 8, 2026). The deck carries the talk; this file carries the live beats. Every beat stands on its own, so you can start anywhere. You still review each result before it ships.

The app is a demo console for TurboTax tax experts during extension season. The data is synthetic: 24 filers, tax year 2025, and a clock frozen on **8 October 2026** — one week before the Oct 15 extension deadline. The pastes below match the copy-paste blocks on `/runbooks/301`.

## Deck map

| Deck section | Slides | Live beats on `/runbooks/301` |
| --- | --- | --- |
| 01 The cultural shift | 3–6 | Talk only |
| 02 Context engineering | 7–11 | Open AGENTS.md, ask what rides every turn, personal and team skills, trigger the hook, read the context ring |
| 03 Decompose & scope | 12–14 | **Live demo A** — Plan mode, four sessions, edit a criterion, save the plan, start Session 1 |
| 04 Orchestrating at scale | 15–19 | **Live demo B** — Build in Parallel, task cards, verify with `turbotax-reviewer`, download the CSV |

The pastes below and on `/runbooks/301` match the speaker notes on slides 14 and 19. Two fallback branches are prepared in this repo: `demo/session-1-done` (Session 1 finished) and `demo/all-sessions-done` (all four sessions, reviewed).
| 05 Cost engineering | 20–24 | Model per role, usage dashboard, fresh chat per task |

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

- `npm test` is **0 failed / 34 passed**.
- The dashboard shows **Refunds Accepted $5,723.00** (up 37.9% on the prior 30 days), **6** extended returns not yet filed, **3** e-file rejects, and **4** open credit reviews.
- [rev_1043](http://127.0.0.1:43173/reviews/rev_1043) shows **Allowed credit $2,500.00** in red under a **$4,000** claim, with Approve and Decline disabled.
- [ret_1043](http://127.0.0.1:43173/returns/ret_1043) has no "Download tax summary (CSV)" link yet. Live demo B adds it.
- The project hook is on: Customize > Hooks lists `.cursor/hooks/synthetic-prompt.mjs`.
- Models are picked: a frontier model for Plan mode (slide 22 uses Claude Opus 5.5) and Auto or Grok 4.7 for the build.

If the CSV link already exists or the suite count is off, a prior run left work behind. Run `npm run demo:reset`.

---

## How to narrate

For each beat:

- **Before:** "Here is the task and the boundary I am giving the agent."
- **During:** "It is reading, editing, or checking. I can inspect each action."
- **After:** "Here is the evidence. I decide whether the result ships."

Do not read prompts aloud. State the intent, paste from the card, then narrate what changed in plain language. The audience builds tax software every day — let the domain carry itself and keep the focus on how the work is shaped.

---

## 02 · Context engineering (slides 7–11)

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

## 03 · Decompose & scope — live demo A (slide 14)

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

**Look for:** four sessions that match slide 13:

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

**Optional:** the same decomposition is encoded as a team skill in `.cursor/skills/decompose-feature/SKILL.md` — the "encode one playbook" point on slide 25.

---

## 04 · Orchestrating at scale — live demo B (slide 19)

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

---

## 05 · Cost engineering (slides 20–24)

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

The reset restores tracked files, removes untracked demo output under `app/`, `components/`, `lib/`, `tests/`, and `.cursor/`, reseeds SQLite, restarts port 43173, and confirms **0 failed / 34 passed**. It lists any Build in Parallel worktrees for you to remove.

---

## Do not

- Paste a real SSN, EIN, or customer email into a prompt. The hook blocks it, and it should.
- "Correct" the $4,000 claim on `rev_1043` or any seeded amount.
- Finish the credit-review stub outside the optional beat.
- Treat a green verifier as a ship decision.
