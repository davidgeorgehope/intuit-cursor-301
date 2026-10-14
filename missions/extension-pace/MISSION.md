# Extension pace

Outcome: every rejected return shows 7 days left, counted from the frozen clock (8 October 2026) to the 15 October 2026 extension deadline.

Done when: `npm test -- tests/extension-pace.test.ts` exits 0.

Stop: that command exits 0, or the stop hook has sent 3 follow-ups.

Escalation: write `missions/escalation.md` and stop. Do not edit `lib/tax-year.ts`, the seed, or the credit-review resolve stub.

Budget: 3 follow-ups. Each one is another model turn. The dry-run harness reports $0. A live CLI or SDK run spends tokens.

Arm: `npm run mission:arm -- extension-pace`

Plant the failing test: `npm run mission:plant`

Restore: `npm run mission:restore`

The numbers live in `missions/registry.json`. If this file and the registry disagree, the registry is what the stop hook runs.
