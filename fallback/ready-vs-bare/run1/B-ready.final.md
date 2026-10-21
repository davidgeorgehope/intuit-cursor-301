Tracing the rejects page and how extension days left are computed.


Defaulting `extensionDaysLeft` to the frozen demo clock (`DEMO_AS_OF`) instead of the wall clock.


**Cause:** `extensionDaysLeft()` in `lib/extension-pace.ts` used `new Date()` (wall clock), so on Oct 21 it showed about **-6 days** instead of **7** from the frozen demo date (Oct 8 → Oct 15). The dashboard already used `DEMO_AS_OF`; the rejects page did not.

**Change:** Default `asOf` to `DEMO_AS_OF` from `lib/clock.ts`, same as the rest of the console.

**Verify:** `npm test -- tests/extension-pace.test.ts tests/verify-console.test.ts` — exit code **0** (7 passed).

Rejected returns should now show **7 days left** on `/rejects`.
