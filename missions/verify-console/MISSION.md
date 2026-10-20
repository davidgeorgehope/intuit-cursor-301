# Verify the running console

Outcome: the app on port 43173 serves the returns API, the rejects page with 7 days left, and the `rev_1043` review with the $2,500.00 allowed credit under a $4,000.00 claim.

Done when: `npm run verify` exits 0.

Stop: that command exits 0, or the stop hook has sent 2 follow-ups.

Escalation: if the server is down, start `npm run dev` and rerun once. If a check still fails, stop and report it. Do not change product code to force a pass.

Budget: 2 follow-ups. Verification is a read.

Arm: `npm run mission:arm -- verify-console`

The skill is `.cursor/skills/verify-expert-ops/SKILL.md`. The feature map is `features/README.md` next to it.

The numbers live in `missions/registry.json`. If this file and the registry disagree, the registry is what the stop hook runs.
