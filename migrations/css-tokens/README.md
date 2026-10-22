# CSS token migration: deterministic codemod + hook + golden tests

The live version of deck slides 16 and 17. Token names are EXAMPLES, not Intuit's design system.

| Part | File |
|---|---|
| 1. map.json: old token -> new token, one source of truth | `migrations/css-tokens/map.json` |
| 2. Codemod: reads the map, rewrites `var(--old)` to `var(--new)` | `migrations/css-tokens/codemod.mjs` |
| 3. Hook: afterFileEdit runs the codemod on each edited `.css` file | `.cursor/hooks/migrate-css-tokens.mjs`, registered in `.cursor/hooks.json` |
| 4. Golden tests: same bytes, second run no change, any order same result | `migrations/css-tokens/codemod.test.mjs`, fixtures in `fixtures/input` and `fixtures/golden` |

```bash
npm run migrate:check    # exit 1: lists legacy tokens in migrations/css-tokens/sample
npm run migrate:tokens   # rewrites them (2 replacements); run again: 0 changes
npm run migrate:golden   # 6 golden tests (node --test), no model, no tokens
npm run hooks:smoke      # includes "migrate css on edit"
git checkout migrations/css-tokens/sample   # restore the demo file
```

Rules the codemod follows: one regex pass with a map lookup (no model). A new token is never an old token
(checked when the map loads), so a second run changes nothing. Files are sorted, and each file is
migrated on its own, so file order cannot change the result. `var(--brand-blue-dark)` is not touched.

The BDK example (`bdk/css-token-watch/bot/lib/token-map.ts`) keeps its own copy of the map, because a BDK
project must stand alone. Golden test 6 fails if the two drift apart.

Recorded output (Oct 22, 2026): `fallback/css-tokens/2026-10-22.txt`, including a real Cursor CLI run where
the agent wrote `var(--brand-blue)` and the afterFileEdit hook rewrote it to `var(--color-action-primary)`.
The same hook in the IDE: UNVERIFIED.
