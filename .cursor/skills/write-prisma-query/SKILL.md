---
name: write-prisma-query
description: Write a correct Prisma query against the TurboTax Expert Ops seeded SQLite database. Use when someone asks to pull, count, or aggregate returns, forms, filers, or credit reviews from the demo seed — e.g. "which returns were rejected" or "total refunds accepted last week".
---

# Write a Prisma query

Produce a query that runs against this repo's real schema and seed, not a generic Prisma example.

## Ground rules

- Schema: `prisma/schema.prisma` — `Filer`, `TaxReturn`, `TaxForm`, `CreditReview`. Client singleton: import `prisma` from `@/lib/prisma` (server code only).
- All money is **integer cents** (`amountCents`, `withheldCents`, `refundCents`, `allowedCreditCents`). A negative `refundCents` is a balance due. Format with `formatUsd` or `formatRefund` from `@/lib/money`. Never introduce floats.
- Statuses are strings validated by `lib/status.ts`: returns `EXTENDED | READY | TRANSMITTED | ACCEPTED | REJECTED`; reviews `OPEN | NEEDS_REVIEW | APPROVED | DECLINED`. Form types are `W-2 | 1099-INT | 1098-T` (`lib/forms.ts`).
- "Today" is the frozen demo clock: import `DEMO_AS_OF` from `@/lib/clock` (Oct 8, 2026). Never use `new Date()` for aging. Deadlines come from `lib/tax-year.ts`.
- IDs look like `ret_1043`, `rev_1043`, `fil_marlow`, `frm_1043_1`. Single workspace: `ws_expertops`.
- Never select or print a full SSN — `ssnLast4` is all there is.
- Existing query helpers live in `lib/data.ts` — extend that file rather than scattering `prisma.` calls inside components.
- There is no project database MCP. Use Prisma here, `lib/data.ts`, or `curl` against `/api/returns` and `/api/reviews`.

## Recipe

1. Restate what rows and columns the user wants.
2. Write the query with `include`/`select` kept minimal, ordered deterministically (`orderBy`), and typed by inference (no `any`).
3. If it is for a page or API route, put it in `lib/data.ts` and call it from the server component or route handler.
4. Show how to verify: a one-off `npx tsx` snippet or an existing API route such as `curl http://127.0.0.1:43173/api/returns?status=REJECTED`.

## Example shape

```ts
export async function getBalanceDueTotalCents() {
  const owing = await prisma.taxReturn.findMany({
    where: { refundCents: { lt: 0 } },
    select: { refundCents: true },
  });
  return sumCents(owing.map((taxReturn) => -taxReturn.refundCents));
}
```
