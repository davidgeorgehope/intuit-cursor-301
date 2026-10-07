# app/api

Route handlers only. This file wins over the root AGENTS.md for anything under `app/api/`. The full recipe is `.cursor/skills/create-api/SKILL.md`.

- Read the request, call one helper from `lib/` (queries live in `lib/data.ts`), return a response. Never import `prisma` here.
- Dynamic `params` are a `Promise` — await them.
- Unknown ids return 404 `{ error: "<Resource> not found" }`. Bad input returns 400 `{ error: "..." }`.
- Money fields stay integer cents. Text responses such as CSV set `Content-Type` and `Content-Disposition` explicitly.
- Never return a full SSN. `ssnLast4` is the only SSN field.
- Every new route gets a Vitest file that calls the exported handler, like `tests/returns-api.test.ts`.
