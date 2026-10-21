Searching the codebase for the rejects page and how extension days are calculated.
`extensionDaysLeft()` defaults to real time instead of the frozen demo clock (`DEMO_AS_OF`), so the rejects page shows incorrect days vs the dashboard.
**Cause:** `extensionDaysLeft()` in `lib/extension-pace.ts` used `new Date()` (wall clock) instead of the frozen demo date `DEMO_AS_OF` (`2026-10-08`). The rejects page calls it with no argument, so every row showed days left from “today” (e.g. Oct 21 → negative or wrong) instead of **7 days** to match the dashboard and the rest of the app.

**Change:** Default `asOf` to `DEMO_AS_OF`, same pattern as `lib/clock.ts` (“never `Date.now()`”).

**Trade-off:** If you ever run this console outside the demo with a live clock, you’d pass an explicit `asOf` or change the default — for this product, frozen demo time is the right default.
