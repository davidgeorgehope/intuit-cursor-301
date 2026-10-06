# TurboTax Expert Ops demo howto

Presenter run-of-show for **Intuit × Cursor 301 — Orchestrating how you work** (Intuit Tech Learning, October 8, 2026). The deck carries the talk; this file carries the live beats. Every beat stands on its own, so you can start anywhere. You still review each result before it ships.

The app is a demo console for TurboTax tax experts during extension season. The data is synthetic: 24 filers, tax year 2025, and a clock frozen on **8 October 2026** — one week before the Oct 15 extension deadline. The pastes below match the copy-paste blocks on `/runbooks/301`.

## Deck map

| Deck section | Slides | Live beats on `/runbooks/301` |
| --- | --- | --- |
| 01 The cultural shift | 3–6 | Talk only |
| 02 Context engineering | 7–11 | Open AGENTS.md, ask what rides every turn, personal and team skills, trigger the hook, read the context ring |
| 03 Decompose & scope | 12–14 | **Live demo A** — Plan mode, `decompose-feature`, four session cards, save the plan |
| 04 Orchestrating at scale | 15–19 | **Live demo B** — approve at the gate, Build in Parallel, `acceptance-verifier`, `turbotax-reviewer` |
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

**Open:** a new agent in **Plan** mode on a frontier model.

**Why:** One feature, four reviewable slices. **Benefit:** each session has inputs and a done-when line, so the work can be checked. **Why it matters:** mergeable PRs, not hero diffs.

**Paste:**

```text
/plan Use the decompose-feature skill. Feature: on the return page, a labeled link downloads the filer's tax summary for one tax year as CSV. The year comes from ?year=. Unknown filer is 404; a bad year is 400. Do not write code yet.
```

**Look for:** four session cards that match slide 13:

| Session | Inputs | Done when |
| --- | --- | --- |
| 1 · Data model | `lib/data.ts`, schema, demo clock | Typed rows in integer cents |
| 2 · API | Returns route, `create-api` skill | CSV 200, 404 unknown, 400 bad year |
| 3 · Frontend | Return page, Button component | Labeled link downloads the CSV |
| 4 · Tests | Handler-test pattern, seeded DB | 3 cases pass; `npm test` green |

API and frontend should be marked as parallel after the data model. Each card owns its own files.

**Do:** Save the plan to the workspace.

**Fallback:** if the live plan goes sideways, open `.cursor/plans/tax-summary-export.fallback.md` — the same four sessions with a shared contract.

---

## 04 · Orchestrating at scale — live demo B (slide 19)

**Say:** "Three rungs, one question: does the work actually split? Here only API and frontend do. The data model goes first; tests go last."

1. **Approve at the gate.** The plan is the contract. Nothing writes code before it.
2. **Build in Parallel.** The data model runs first; the API and frontend sessions run side by side in their own worktrees; tests run last.
3. **Watch the task cards.** Each card names its model and the files it touched. Sibling sessions should not overlap.
4. **Verify.** Paste:

```text
Use the acceptance-verifier subagent on the tax summary export plan. Report PASS, PARTIAL, or FAIL for each session's done-when line, with the command you ran and what it returned.
```

5. **Review.** Paste:

```text
turbotax-reviewer check my work
```

**Look for:** four PASS lines with commands and evidence, a green `npm test`, and the link on [ret_1043](http://127.0.0.1:43173/returns/ret_1043) downloading `tax-summary-fil_marlow-2025.csv` (or the name the plan chose). The reviewer should report no SSN in the CSV.

**Fallback:** if Build in Parallel is not available, paste `/multitask @tax-summary-export.fallback.md`.

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
