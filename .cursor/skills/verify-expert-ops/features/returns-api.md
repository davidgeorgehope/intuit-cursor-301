# Returns API

The returns list is the JSON behind the returns page. A tax expert can filter it by status. The payload never includes a full SSN.

## Sub-features

- `returns-list` returns HTTP 200 and a non-empty `returns` array on the seeded database.
- `returns-no-ssn` keeps SSN-shaped numbers out of that payload.

## How to get to it (user POV)

- Open Returns in the console nav.
- Call `GET /api/returns` from a script.

## Driving it with verify-expert-ops

Preconditions:

- `npm run dev` is serving `http://127.0.0.1:43173`.
- The database has been seeded.

- **List.** Open Returns, or run `curl -sS -o /tmp/returns.json -w "%{http_code}" http://127.0.0.1:43173/api/returns`. HTTP 200 and the body has a `returns` array with at least one row.
- **No SSN.** Scan that body for a `###-##-####` pattern. It must not match. `ssnLast4` may be present; do not print it.
- **Proof.** `npm run verify` writes `artifacts/verify-expert-ops/returns-api.txt` with the PASS line.

## Gotchas

- An empty array means the seed did not run. Reseed. Do not invent a filer.
- The page HTML is not the proof for this feature. The API body is.
