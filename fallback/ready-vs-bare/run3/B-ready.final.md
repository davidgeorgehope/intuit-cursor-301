Tracing how extension days are computed and displayed on the rejects page.
`extensionDaysLeft()` defaults to the wall clock instead of the frozen demo date (`DEMO_AS_OF`, Oct 8, 2026).
**Cause:** `extensionDaysLeft()` in `lib/extension-pace.ts` used `new Date()` as the default “as of” date, so the rejects page counted from today instead of the demo clock (Oct 8, 2026). On Oct 21 that showed **-6 days** instead of **7 days** (same as the dashboard’s “Extended, not filed” KPI).

**Fix:** Default `asOf` to `DEMO_AS_OF` from `lib/clock.ts`, consistent with the rest of the app.

**Verification:** `npm test -- tests/extension-pace.test.ts tests/verify-console.test.ts` — exit code **0** (7 passed).

**Trade-off:** Any future caller that passes no `asOf` always gets demo-relative days, even outside the demo environment. That’s intentional here; real “today” should pass an explicit date if needed.
