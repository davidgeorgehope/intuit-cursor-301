# Rejected returns

The rejects queue lists IRS rejects and how many days remain before the extension deadline.

## Sub-features

- `rejects-heading` shows the Rejected returns heading.
- `rejects-days` shows 7 days left on 8 October 2026.

## How to get to it (user POV)

- Choose E-file rejects in the console nav.
- Open `http://127.0.0.1:43173/rejects`.

## Driving it with verify-expert-ops

Preconditions:

- The server is up on port 43173.
- `lib/extension-pace.ts` is the healthy shape, not the planted off-by-one.

- **Open the queue.** Run `curl -sS http://127.0.0.1:43173/rejects`. HTTP 200 and the body contains `Rejected returns`.
- **Read the pace.** The same body contains `7 days left`.
- **Proof.** `npm run verify` writes `artifacts/verify-expert-ops/rejects.txt`.

## Gotchas

- The planted loop bug subtracts one day. The page then says 6 days left and this check fails. Restore with `npm run mission:restore` if you are not running the loop.
- Do not change `lib/tax-year.ts` to make the number match. The deadline stays 15 October 2026.
