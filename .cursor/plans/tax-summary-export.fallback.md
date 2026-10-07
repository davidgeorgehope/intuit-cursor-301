# Tax summary export (CSV) — four scoped sessions

Fallback for the live decompose beat. It is the shape the `decompose-feature` skill produces: data → (API + frontend) → tests.

Chat prompt for the orchestrate fallback:

```
/multitask @tax-summary-export.fallback.md
```

Coordinator behavior (no wrapper Task, the first Tasks are the named sessions, the contract goes in each prompt) is `.cursor/rules/multitask-no-wrapper.mdc`. Launch shape is `.cursor/skills/dispatch-subagents/SKILL.md`. Do not implement in the parent.

## Feature

On the return page, a labeled link downloads the filer's tax summary for one tax year as CSV: one row per form on file — form type, issuer, amount, federal withholding — then a totals row from `returnTotals` in `lib/forms.ts` (total income excludes 1098-T tuition). The year comes from `?year=`. An unknown filer is 404; a bad year is 400.

## Shared contract (do not fork)

Session 1 publishes this in `lib/data.ts`:

```ts
export type TaxSummaryRow = {
  formType: string;
  issuer: string;
  amountCents: number;
  withheldCents: number;
};

export async function getTaxSummary(
  filerId: string,
  taxYear: number,
): Promise<{ filerId: string; filerName: string; taxYear: number; rows: TaxSummaryRow[] } | null>;
```

It returns `null` when the filer does not exist, and `rows: []` when the filer has no return for that year.

HTTP — `GET /api/filers/[id]/tax-summary?year=2025`

- 200 with `Content-Type: text/csv; charset=utf-8` and `Content-Disposition: attachment; filename="tax-summary-<filerId>-<year>.csv"`.
- Header row: `form_type,issuer,amount_usd,federal_withholding_usd`. Amounts are dollars with two decimals, converted from cents at the edge.
- 404 `{ error: "Filer not found" }` for an unknown filer.
- 400 `{ error: "year must be a four-digit tax year no later than 2025" }` when `year` is missing, is not four digits, or is later than `TAX_YEAR` in `lib/tax-year.ts`. Build the bound and the message from `TAX_YEAR`; do not type 2025.

No SSN in the CSV, not even the last four digits.

## Sessions

### 1 · Data model

- **Inputs:** @lib/data.ts, @prisma/schema.prisma, @lib/clock.ts, @lib/forms.ts
- **Owns:** `lib/data.ts` — adds `TaxSummaryRow` and `getTaxSummary`
- **Done when:** typed rows in integer cents — `getTaxSummary("fil_marlow", 2025)` returns two rows with integer `amountCents`.
- **Depends on:** nothing

### 2 · API

- **Inputs:** @app/api/returns/[id]/route.ts, @.cursor/skills/create-api/SKILL.md, @app/api/AGENTS.md
- **Owns:** `app/api/filers/[id]/tax-summary/route.ts`, `lib/tax-summary-csv.ts`
- **Done when:** CSV 200, 404 unknown, 400 bad year — `curl -i "http://127.0.0.1:43173/api/filers/fil_marlow/tax-summary?year=2025"` returns 200 and the header row, and `?year=2026` returns 400.
- **Depends on:** 1

### 3 · Frontend

- **Inputs:** @app/returns/[id]/page.tsx, @components/ui/button.tsx
- **Owns:** `app/returns/[id]/page.tsx`
- **Done when:** a labeled link, "Download tax summary (CSV)", on `/returns/ret_1043` downloads the CSV.
- **Depends on:** 1 for the contract. Runs in parallel with 2.

### 4 · Tests

- **Inputs:** @tests/returns-api.test.ts, the seeded database
- **Owns:** `tests/tax-summary-api.test.ts`, plus the suite count wherever it is cited (`README.md`, `demo-howto.md`, `AGENTS.md`, `.cursor/agents/turbotax-reviewer.md`, `.cursor/skills/reset-demo-state/SKILL.md`, `scripts/demo-reset.ts`)
- **Done when:** 3 cases pass (200 CSV, 404 unknown filer, 400 bad year); `npm test` green.
- **Depends on:** 2

## Run order

1. Session 1 alone.
2. Sessions 2 and 3 in the same turn, each in its own worktree.
3. Session 4 after 2 lands.
4. In one turn: `turbotax-reviewer` on the combined diff and `acceptance-verifier` on this plan. The verifier is the finish line.
