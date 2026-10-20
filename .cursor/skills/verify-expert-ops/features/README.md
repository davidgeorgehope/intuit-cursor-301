# Expert Ops verification map

Read the index, then the feature file for the change. A proof that only hits one convenient URL is incomplete when the change can affect another file in this list.

## Baseline preconditions

- The console is at `http://127.0.0.1:43173`, started with `npm run dev` from this repo.
- The database is the seeded synthetic set. Emails end in `.example`.
- The demo clock is 8 October 2026. The extension deadline is 15 October 2026.
- Do not start a second server on this port.

## Driving conventions

- Drive with `npm run verify`, or with `curl -sS` against the paths in the feature file.
- Treat the seeded claim on `rev_1043` as valid input. The allowed credit stays $2,500.00.
- Record the check id and the matching text. Do not copy a response body into the evidence file.

## Proof and skip reporting

- Name the feature and the HTTP status.
- Report a down server as a failed doctor check, not as a failed feature.
- Do not skip a listed feature and call another path a substitute.

## Feature entry contract

Each feature file has an H1, one paragraph, then four H2 sections: `Sub-features`, `How to get to it (user POV)`, `Driving it with verify-expert-ops`, `Gotchas`.

## Features

- [Returns API](./returns-api.md) covers the list a tax expert filters from the returns page.
- [Rejected returns](./rejects.md) covers the days-left line on the rejects queue.
- [Credit review](./credit-review.md) covers the capped American opportunity credit on `rev_1043`.
