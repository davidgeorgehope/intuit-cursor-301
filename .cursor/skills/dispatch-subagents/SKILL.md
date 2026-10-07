---
name: dispatch-subagents
description: Launches isolated Task subagents in one parallel turn for independent TurboTax Expert Ops work. Use for /multitask, when the user asks to run workers at the same time, or when naming api-instrumenter, turbotax-reviewer, or acceptance-verifier.
---

# Dispatch subagents

Hands over **breadth**. Independent pieces run at once; dependent steps stay in order. Each subagent starts with clean context and cannot see the prior chat.

## When to use

- The request has two or more pieces that do not depend on each other's diffs.
- The user said `/multitask`, "in parallel", or named `api-instrumenter`.

Do **not** queue four jobs in one agent. Do **not** start a sibling after another sibling "so it has context" — the dispatch prompt carries everything.

## How to launch

1. Find what is independent. Dependent work waits — in a plan, the data-model session lands before the API and frontend sessions start.
2. In **one** turn, launch one Task subagent per piece. For route instrumentation, use `api-instrumenter` and name **one** route in that prompt.
3. Each dispatch prompt includes: the files it owns, the shared helper path and signature, the constraint (no seed changes, no tax-year edits, no full SSNs), and how to verify that piece.
4. After the diffs land, launch `turbotax-reviewer` on the combined diff and `acceptance-verifier` on the plan in the same turn. They do not depend on each other.
5. Tell the user there is one review per task.

## Constraints

- No sibling cross-talk. A planner or parent only sees its own children.
- Five subagents cost roughly five times one agent. Launch only what is independent and verifiable.
- You still review. Do not merge or commit unless asked.
