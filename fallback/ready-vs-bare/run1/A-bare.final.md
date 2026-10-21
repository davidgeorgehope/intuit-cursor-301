Searching the codebase for the rejects page and how extension days are calculated.


Rejects page uses `extensionDaysLeft()` with `new Date()` instead of the frozen demo clock (`DEMO_AS_OF`); the dashboard uses `DEMO_AS_OF`.


**Cause:** `extensionDaysLeft()` defaulted to `new Date()`, so the rejects page used the real clock. This app freezes time at **Oct 8, 2026** (`DEMO_AS_OF`); the dashboard already uses that for “days left” to Oct 15.

**Change:** Default `asOf` in `lib/extension-pace.ts` to `DEMO_AS_OF` instead of `new Date()`. Rejects now show **7 days left**, aligned with the dashboard KPI.

**Trade-off:** Anything that calls `extensionDaysLeft()` without an explicit date stays on demo time, which is what you want in this console but would be wrong if you later ship a production build that should use real time.
