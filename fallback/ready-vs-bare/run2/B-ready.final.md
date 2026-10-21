Tracing the rejects page and how extension days are calculated.


The rejects page uses `extensionDaysLeft()`, which defaults to the wall clock instead of the frozen demo date (Oct 8, 2026).


**Cause:** `extensionDaysLeft()` in `lib/extension-pace.ts` used `new Date()` as the default “as of” date, so the rejects page counted from the real wall clock instead of the frozen demo date (Oct 8, 2026). The dashboard already used `DEMO_AS_OF` via `daysBetween(EXTENSION_DEADLINE, DEMO_AS_OF)`.

**Fix:** Default `asOf` to `DEMO_AS_OF` from `lib/clock.ts`, same pattern as the rest of the console.

**Verify:** `npm test -- tests/extension-pace.test.ts` — exit **0** (3 passed). Rejected returns should show **7 days left** (Oct 8 → Oct 15).

**Trade-off:** Callers that pass an explicit `asOf` still work; only the no-arg path (rejects page) was wrong. If you ever want “live” countdown in production, you’d need a deliberate env flag rather than silently using `Date.now()`.
