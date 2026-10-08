---
name: choose-cursor-workflow
description: Walk the 301 TurboTax Expert Ops track, then choose the mode, model, rule, or skill that fits the shape of the work. You still review the result.
---

# Walk the 301 track

The demo ships one track: **301**. Every beat is independent — if the user names a beat, jump directly to it. You still review the result.

## The track

301 — You will engineer the context an agent sees, decompose one feature into scoped sessions, orchestrate the parts that split behind a single approval gate, and match each role to a model on purpose.

The beats live in `lib/runbooks/meta.ts` and as copy-paste blocks on `/runbooks/301`. Use the matching `example` verbatim.

Start a demo session with `npm run demo:session -- start` and record any rule, skill, Canvas, or branch a beat creates. Reset is script-first: `npm run demo:reset`.

## Sections and beats

1. **Where do you start?** — the optional refactor check in Ask mode, then the finished refactor on `demo/status-refactor-done`: tests that pin today's behavior first, then the change.
2. **How do you engineer context?** — open AGENTS.md and `app/api/AGENTS.md`, ask what rides every turn, personal and team skills, trigger the SSN hook, read the context ring.
3. **How do you decompose a feature?** — Plan mode, the plan prompt for the tax summary export, review and edit the plan, save it, start the data model session, show the everything-at-once prompt, and the optional `decompose-feature` skill.
4. **How do you orchestrate the work?** — read the data model checklist, Build in Parallel (or the `/multitask` fallback), watch the task cards, verify with `turbotax-reviewer`, download the CSV, the optional `acceptance-verifier`, the `demo/all-sessions-done` fallback branch, the optional credit-review stub, and rung three: a Project on this repo (starter, subscription, gate review, review comment).
5. **How do you spend tokens on purpose?** — the model per role, the usage dashboard, a fresh chat per task.

## Choose the mode

- **Ask** reads and explains; it does not edit. Use it to orient before touching code.
- **Plan** maps an approach before implementation. It ends at the approval gate.
- **Agent** is the default; it inspects, edits, and runs checks within the boundary you give it.
- **Debug** verifies a change and investigates failures with runtime evidence.

## Choose the model

Plan and coordinate on a frontier reasoning model — think once. Build on a fast default across many turns. Keep noisy subagents on a smaller tier. Use Fast variants only when latency matters; they cost more per token. Five parallel subagents cost roughly five times one agent, so parallelize only work that splits and can be verified.

## What does not change

The human reviews the result and decides what ships. Modes and models change how the work runs, not who is accountable.
