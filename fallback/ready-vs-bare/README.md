# Ready vs bare: recorded runs (verified 21 Oct 2026)

Command: `npm run harness:ready-vs-bare -- --save fallback/ready-vs-bare/runN`
Runner: `agent -p --output-format stream-json --force --trust --model composer-2.5` (CLI 2026.10.19-6bbf2c4), local only.
Same prompt in both copies:

> Bug report from the expert team: on the rejects page, every rejected return shows the wrong number of extension days left. Fix it.

Planted bug (both copies): `extensionDaysLeft()` defaults to `new Date()` instead of `DEMO_AS_OF`.
Grade: the harness copies each agent's `lib/` into a clean third tree and runs the hidden `tests/extension-pace.test.ts`, plus a check that the file no longer reads the wall clock.

| Run | Copy | Hidden test | Ran a test itself | Tool calls | Tokens | Seconds |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | A bare | PASS | no | 19 | 268,071 | 29 |
| 1 | B ready | PASS | yes | 13 | 194,703 | 23 |
| 2 | A bare | PASS | no (ran `npm install` in the cold copy) | 19 | 243,513 | 55 |
| 2 | B ready | PASS | yes | 13 | 225,144 | 20 |
| 3 | A bare | PASS | no | 16 | 224,315 | 24 |
| 3 | B ready | PASS | yes | 15 | 247,984 | 27 |

What this shows, honestly:

- Both copies found the right fix 3 of 3 times. The code itself carries a hint (`app/page.tsx` already ages against `DEMO_AS_OF`), so this bug is not hard enough to make the bare agent fail.
- The difference that held every time: B proved the fix with the done-when test (3 of 3). A said "fixed" with no test it could run (0 of 3). A's evidence was a typecheck or a `node -e` probe.
- B used fewer tool calls in all three runs. Tokens were lower for B in runs 1 and 2 and higher in run 3, so do not claim a token saving from three runs.
- Cold vs warm: in run 2 the bare agent ran `npm install` before it could typecheck. That run took 55 s.
- Copy B armed the mission (`missions/active.json`), but the file was still there after each run. The stop hook did not clear it in headless `-p` mode. The `afterFileEdit` hook did fire (`.cursor/hook-logs/format.log`). Cause of the stop-hook gap not confirmed.

Files per run: `*.stream.jsonl` (CLI stream, thinking deltas removed), `*.diff`, `*.final.md` (the agent's last message), `*.summary.json`, `results.json`.
