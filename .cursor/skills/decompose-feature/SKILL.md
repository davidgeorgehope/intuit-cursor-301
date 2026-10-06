---
name: decompose-feature
description: Split one TurboTax Expert Ops feature into scoped sessions — each with inputs, owned files, and a done-when line — then stop at the approval gate. Use in Plan mode for any feature bigger than one reviewable PR, or when asked to decompose, scope, or break down a feature.
---

# Decompose a feature

One feature becomes a few scoped sessions. Each session is something one agent can finish in one chat and a reviewer can read in one diff.

## Session cards

Write one card per session, numbered in the order they can start:

- **Title** — the usual shape here is `1 · Data model`, `2 · API`, `3 · Frontend`, `4 · Tests`.
- **Inputs** — `@` pointers to the files and skills the session needs. Name the existing pattern to copy. Do not paste code.
- **Owns** — the files this session may create or edit. Two sessions never own the same file.
- **Done when** — one line you can check: a command, a status code, or something visible on a page. No adjectives.
- **Depends on** — the sessions that must land first.

## Order

- Data model first: types and query helpers in `lib/`, integer cents, the frozen clock in `lib/clock.ts`.
- API and frontend run in parallel after the data model, against the helper signature it publishes.
- Tests last, against the seeded database. `npm test` stays green.
- If two sessions would edit the same file, merge them or move the shared piece into the data-model session.
- Say which sessions can run in parallel and which cannot. Most features here are serial except API and frontend.

## Gate

Stop after the cards. The plan is the contract: save it under `.cursor/plans/` and wait for approval. Nothing writes code before the gate.

## Defaults in this repo

- Routes follow `.cursor/skills/create-api/SKILL.md` and `app/api/AGENTS.md`.
- Pages are server components under `app/`. Reuse `components/ui/button.tsx` and the other `components/ui/` primitives.
- Handler tests follow `tests/returns-api.test.ts`.
- Do not plan a schema change or a new dependency unless the feature needs one. If it does, say so on the card.
