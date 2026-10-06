<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TurboTax Expert Ops

Demo console for the Intuit × Cursor 301 session. Tax year 2025, synthetic filers, operator Avery Quinn, no auth.

## Build & test

- Setup: `npm i && npx prisma generate && npx prisma db seed` (the seed is safe to re-run).
- Dev server: `npm run dev` on port **43173**.
- Tests: `npm test`. Shipped suite on a clean tree: **0 failed / 34 passed**.
- Lint: `npm run lint`. Reset after a demo: `npm run demo:reset`.

## Data

- Filers come only from `prisma/seed.ts` and `prisma/extra-filers.ts`. Emails end in `.example`.
- Never write a full SSN anywhere. The database stores `ssnLast4`; fixtures use SSNs that start with `000`.
- Money is integer cents. Format at the edge with `formatUsd` or `formatRefund` (`lib/money.ts`).
- Limits and deadlines come from `lib/tax-year.ts`. Age anything against `lib/clock.ts` (Oct 8, 2026), never `Date.now()`.

## API

- Conventions: `app/api/AGENTS.md` and `.cursor/skills/create-api/SKILL.md`.

## Agent behavior

- One scoped session per chat. Carry the plan forward, not the transcript.
- Plans live in `.cursor/plans/`. Stop when the plan's done-when lines pass.
- `rev_1043` claims $4,000 against the $2,500 AOTC limit on purpose. Do not "correct" the claim.
- `lib/reviews/resolve.ts`, its route, and the review page panel are unfinished on purpose. Leave them unless asked.
- Review with `turbotax-reviewer`; verify a plan with `acceptance-verifier`.
- Runbook beats: `lib/runbooks/meta.ts` and `/runbooks/301`. Run-of-show: `demo-howto.md`.

## Definition of done

- `npm test` and `npm run lint` pass, and the changed page or route was exercised on port 43173.
- If the suite count changed, every doc that cites it was updated (`tests/runbooks.test.ts` checks).
