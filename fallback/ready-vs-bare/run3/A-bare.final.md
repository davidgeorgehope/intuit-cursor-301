Searching the codebase for how extension days are calculated on the rejects page.
`extensionDaysLeft()` defaults to `new Date()` instead of the frozen demo clock (`DEMO_AS_OF`), so the rejects page shows wall-clock days instead of 7.
**Cause:** `extensionDaysLeft()` in `lib/extension-pace.ts` used `new Date()` as the default “as of” date. The app’s demo clock is frozen at **Oct 8, 2026** (`DEMO_AS_OF`), so on the rejects page every row showed wall-clock days to Oct 15 (e.g. negative or wrong) instead of **7 days**, which matches the dashboard.

**Change:** Default `asOf` to `DEMO_AS_OF`, consistent with `lib/clock.ts` (“never `Date.now()`”).

**Trade-off:** If this helper is ever reused outside the frozen demo, callers must pass an explicit `asOf`; the default is demo-only by design.
