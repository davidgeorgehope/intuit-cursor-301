# TurboTax Expert Ops

Demo console for the **Intuit × Cursor 301** session, "Orchestrating how you work," on October 8, 2026. A tax expert, Avery Quinn, works extension season for tax year 2025: e-file rejects, education-credit reviews, and returns due on the Oct 15 extension deadline. The demo clock is frozen on **8 October 2026**. Every filer is synthetic.

Copy-paste prompts live on `/runbooks/301`. The presenter run-of-show, mapped to the session deck, is `demo-howto.md`.

## Run

Node 20 or later. Nothing else global.

```bash
npm i
npx prisma generate
npx prisma db seed
npm run dev
```

Open **http://localhost:43173**, or ask an agent to run the `start-expert-ops` skill — it starts the app on 43173 and seeds only when the database is empty.

`npm test` is **0 failed / 34 passed** on a clean tree. The prompt hook has its own tests: `node --test .cursor/hooks`. Reset after a session with `npm run demo:reset`.

## App

| Page | What it shows |
| --- | --- |
| Dashboard | Refunds accepted in the last 30 days, extended returns not yet filed, e-file rejects, open credit reviews |
| Returns | 24 Form 1040s with their W-2, 1099-INT, and 1098-T forms. Filter by status; search by filer, state, or number |
| E-file rejects | IND-031-04, IND-032-04, and IND-181-01 rejects, with the fix and the days left before Oct 15 |
| Credit reviews | AOTC and lifetime learning credit claims, capped at the 2025 limits. `rev_1043` claims $4,000 against the $2,500 limit on purpose |
| Settings | Tax year 2025 limits and the taxpayer-data rules |

The credit-review resolution panel (`lib/reviews/resolve.ts`, its route, and the review page) is unfinished on purpose. `.cursor/plans/resolve-review.md` finishes it as an optional second orchestration.

## Taxpayer data

- Filers, employers, and schools are invented. Emails end in `.example`.
- The database stores only `ssnLast4`. Test fixtures use SSNs that start with 000.
- `.cursor/hooks/synthetic-prompt.mjs` blocks a prompt with an SSN- or EIN-shaped number, a non-`.example` email, or a live credential before the model sees it.
- Refunds were computed offline from the 2025 Tax Table and standard deduction, with a credit only where a review was approved. The app reads them from the seed; it is not a tax engine. Education-credit limits are the only tax rules the app computes (`lib/education-credit.ts`).

## Agent context

| Path | Role |
| --- | --- |
| `AGENTS.md` | About 40 lines: commands, data rules, definition of done |
| `app/api/AGENTS.md` | Nested route conventions — wins under `app/api/` |
| `.cursor/rules/turbotax.mdc` | The one always-on product rule |
| `.cursor/hooks.json` | The synthetic-data hook — a hard stop outside the model |
| `.cursor/skills/decompose-feature/` | Split a feature into scoped session cards, then stop at the gate |
| `.cursor/skills/create-api/` | Add one route: `lib/` helper, handler, Vitest on the handler |
| `.cursor/agents/turbotax-reviewer.md` | Read-only reviewer after a change |
| `.cursor/agents/acceptance-verifier.md` | PASS / PARTIAL / FAIL against a plan's done-when lines |
| `.cursor/agents/api-instrumenter.md` | `/multitask` worker — one API route |
| `.cursor/plans/tax-summary-export.fallback.md` | Fallback plan for the live decompose beat |

Other project skills: `choose-cursor-workflow`, `dispatch-subagents`, `hand-to-cloud-agent`, `start-expert-ops`, `write-prisma-query`, `add-dashboard-widget`, `draft-filer-message`, and `reset-demo-state`.

## Starter prompts

Ask:

```text
/ask What does this application do, and which seeded returns were rejected? Cite lib/rejects.ts and prisma/seed.ts. Do not edit any files.
```

Decompose (live demo A):

```text
/plan Use the decompose-feature skill. Feature: on the return page, a labeled link downloads the filer's tax summary for one tax year as CSV. The year comes from ?year=. Unknown filer is 404; a bad year is 400. Do not write code yet.
```

Verify (live demo B):

```text
Use the acceptance-verifier subagent on the tax summary export plan. Report PASS, PARTIAL, or FAIL for each session's done-when line, with the command you ran and what it returned.
```

## Notes

- Filers come only from `prisma/seed.ts` and `prisma/extra-filers.ts`. Limits and deadlines come only from `lib/tax-year.ts`.
- Port 43173 busy: stop the old `npm run dev`. Empty dashboard: `npm run db:reset`.
- `npm run demo:reset` refuses to run unless `origin` is the `intuit-cursor-301` repository.
