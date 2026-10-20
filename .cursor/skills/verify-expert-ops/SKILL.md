---
name: verify-expert-ops
description: Drive the running TurboTax Expert Ops console on port 43173 and prove a feature from the map. Use when a change should be checked against the app, not only the unit tests, including "does the rejects page still show 7 days left?"
---

# Verify Expert Ops

Drive the console a tax expert actually opens. The harness is HTTP against `http://127.0.0.1:43173`. This demo shares that port with the 301 session, so do not start a second server.

## Launch

From the repo root, if nothing is listening:

```bash
npm run dev
```

Ready means `GET /api/returns` returns HTTP 200 and a `returns` array. A process that has bound the port while the database is still empty is not ready. Seed with `npx prisma db seed` first when the array is empty.

## Doctor

```bash
npm run verify
```

Read the PASS/FAIL lines. If the script says the server is not answering, start `npm run dev` and rerun. Do not change product code to make a check pass.

`npm run check` is the rung below this one: typecheck, lint, and unit tests. Green checks are not this skill. This skill drives the running app.

## Drive

Read `features/README.md`, then the one feature file for the change. Run the commands in that file. The script drives three features in one pass; a single-feature proof still has to match that file's observable end state.

## Evidence

The script writes one file per check under `artifacts/verify-expert-ops/`. Each file is the PASS/FAIL line, not the page body. Leave those files in place. They are gitignored.

## Cleanup

Do not kill a server you did not start. This skill does not own `npm run dev` when the presenter already started it. Cleanup is "stop if and only if you started it, and never by process name."

## Helpers

`npm run verify` runs `scripts/verify-expert-ops.ts`. The checks live in `lib/verify-console.ts`.

## Keeping it current

When a mapped page changes, update that feature file in the same change. A map that names a control the page no longer has is wrong. The public `maintain-verification-skill` pattern is one read of the source and one live pass, then at most the corrections that pass. This demo does not ship that second skill. Re-run `npm run verify` after a feature-file edit.

The shape of this skill (launch, doctor, drive, evidence, cleanup, and the four feature-file headings) follows `create-verification-skill` in the public pstack plugin, MIT, https://github.com/cursor/plugins/tree/main/pstack. The words here are for this console.
