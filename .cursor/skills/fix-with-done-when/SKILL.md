---
name: fix-with-done-when
description: Fix a reported bug and prove the fix with the test that covers it. Use for any bug report, wrong number, or failing mission, including "the rejects page shows the wrong extension days left".
---

# Fix with a done-when check

A fix is done when a test proves it. Your own reading of the code does not count.

1. Find the check. Look in `missions/registry.json` and `missions/*/MISSION.md` for a done-when command that covers the symptom. If none fits, find the test in `tests/` that imports the changed module.
2. Run the check first. Watch it fail. Read the expected value in the test. The test states what "right" means; the bug report does not.
3. Fix the cause in product code. Follow `AGENTS.md`: dates age against `DEMO_AS_OF` in `lib/clock.ts`, limits and deadlines come from `lib/tax-year.ts`, money is integer cents.
4. Run the check again. Report the command and its exit code.
5. If you cannot make it pass inside the mission budget, write `missions/escalation.md` and stop. Do not change the test to force a pass.

Setup on a cold machine: `npm run setup`.
