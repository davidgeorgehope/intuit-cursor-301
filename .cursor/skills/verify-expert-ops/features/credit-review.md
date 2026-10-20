# Credit review

`rev_1043` claims $4,000.00 of American opportunity credit. The console allows $2,500.00. The claim is supposed to be higher than the cap.

## Sub-features

- `review-allowed` shows Allowed credit $2,500.00.
- `review-claim` still shows the $4,000.00 claim.

## How to get to it (user POV)

- Open Credit reviews and choose the review on return TY25-1043.
- Open `http://127.0.0.1:43173/reviews/rev_1043`.

## Driving it with verify-expert-ops

Preconditions:

- The server is up on port 43173.
- The credit-review resolve stub is still unfinished. This check does not click Approve.

- **Open the review.** Run `curl -sS http://127.0.0.1:43173/reviews/rev_1043`. HTTP 200.
- **Read both amounts.** The body contains `Allowed credit`, `$2,500.00`, and `$4,000.00`.
- **Proof.** `npm run verify` writes `artifacts/verify-expert-ops/credit-review.txt`.

## Gotchas

- "Fixing" the claim down to $2,500.00 fails this check. The claim stays $4,000.00.
- Approve and Decline stay disabled. Do not finish the resolve stub to make the page look done.
