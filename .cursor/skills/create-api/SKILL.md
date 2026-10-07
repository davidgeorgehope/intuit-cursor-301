---
name: create-api
description: Add one TurboTax Expert Ops HTTP route using this app's App Router, lib/data, tax-year, and Vitest conventions. Use when creating a new API endpoint, route handler, or app/api route — including CSV exports.
---

# Create an API

Add one route in this repo. Match the handlers already under `app/api/`; the short version of these rules is `app/api/AGENTS.md`. If the workspace is a different app, stop — these paths do not apply.

## Steps

1. Put domain work in `lib/` (queries in `lib/data.ts`). The route file only reads the request, calls that helper, and returns a response.
2. Add `app/api/<resource>/route.ts`, or a folder under `app/api/<resource>/[id]/` for one record. Export `GET`, `POST`, or both.
3. Add a Vitest file that imports the handler. Cover the success body and each error status you return.
4. If the shipped test count changes, update every doc that cites it in the same change.

## Handler

Imports stay at the top of the file. Dynamic `params` in this Next.js app are a `Promise` — await them. Name the field after the folder (`[id]` → `id`).

```ts
import { NextResponse } from "next/server";
import { getReturn } from "@/lib/data";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taxReturn = await getReturn(id);
  if (!taxReturn) {
    return NextResponse.json({ error: "Return not found" }, { status: 404 });
  }
  return NextResponse.json({ return: taxReturn });
}
```

List routes read filters from `request.url`. Returns filter on `status` and `q`; credit reviews filter on `status`. Unknown ids return `{ error: "<Resource> not found" }` with 404. Invalid JSON, a bad `action`, or a bad query value (for example `year=abc`) returns 400 `{ error: "..." }`.

On a `switch` over a status, credit, or action union, handle every member and use a `never` check in `default`.

## Money, dates, and taxpayer data

- Money fields are integer cents (`amountCents`, `withheldCents`, `refundCents`, `allowedCreditCents`). Format with `formatUsd` only at an edge that shows a string. In CSV, write dollars with two decimals from cents; never do float math in between.
- The tax year is `TAX_YEAR` in `lib/tax-year.ts` (2025). Limits and deadlines live there too. Dates are UTC; format with `formatDate` or as `YYYY-MM-DD`.
- Never return a full SSN. `ssnLast4` is the only SSN field; mask it as `•••-••-1234` or leave it out.
- Statuses are validated by `lib/status.ts`: returns `EXTENDED | READY | TRANSMITTED | ACCEPTED | REJECTED`; reviews `OPEN | NEEDS_REVIEW | APPROVED | DECLINED`.

## Text responses

For CSV or any non-JSON body, return a plain `Response` with explicit headers:

```ts
return new Response(csv, {
  headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="tax-summary-${filerId}-${year}.csv"`,
  },
});
```

Quote any field that contains a comma, a quote, or a newline, and double the quotes inside it.

## Tests

Call the exported handler. Do not boot the server. Handler tests read the seeded SQLite file (`npx prisma db seed`).

```ts
import { describe, expect, it } from "vitest";
import { GET as getReturn } from "@/app/api/returns/[id]/route";

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("returns API", () => {
  it("returns 404 when the return is missing", async () => {
    const response = await getReturn(new Request("http://localhost/api/returns/ret_missing"), params("ret_missing"));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Return not found" });
  });
});
```

For a CSV response, assert the status, the `Content-Type` header, and the header row of `await response.text()`.

When a new test changes how many pass, set the same count in `README.md`, `demo-howto.md`, `AGENTS.md`, `.cursor/agents/turbotax-reviewer.md`, `.cursor/skills/reset-demo-state/SKILL.md`, and `scripts/demo-reset.ts`. `tests/runbooks.test.ts` fails if they disagree.

## Leave these alone

- Do not implement `lib/reviews/resolve.ts`, `app/api/reviews/[id]/resolve/route.ts`, or the review page panel unless that stub is the task.
- Do not change the `rev_1043` claim or any seeded amount.
- Do not call `prisma` from a route. Import it from `@/lib/prisma` only inside `lib/`. There is no database MCP.

Comment only a non-obvious constraint. Do not cite Slack, GitHub, or issue-tracker URLs in comments.

## Verify

```bash
npm test
curl -sS -i http://127.0.0.1:43173/api/<path>
```

The dev server listens on port **43173**. If it is not running, start it with the `start-expert-ops` skill before curling.
