import type { TaxSummaryRow } from "@/lib/data";
import { returnTotals } from "@/lib/forms";

const HEADER = "form_type,issuer,amount_usd,federal_withholding_usd";

/** Dollars with two decimals. Integer cents only — no binary float. */
function centsToUsd(cents: number): string {
  const negative = cents < 0;
  const absolute = Math.abs(cents);
  const dollars = Math.trunc(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, "0");
  return `${negative ? "-" : ""}${dollars}.${fraction}`;
}

function csvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function csvRow(fields: readonly string[]): string {
  return fields.map(csvField).join(",");
}

export function taxSummaryCsv(rows: readonly TaxSummaryRow[]): string {
  const totals = returnTotals(rows);
  const lines = [
    HEADER,
    ...rows.map((row) =>
      csvRow([row.formType, row.issuer, centsToUsd(row.amountCents), centsToUsd(row.withheldCents)]),
    ),
    csvRow(["total", "", centsToUsd(totals.incomeCents), centsToUsd(totals.withheldCents)]),
  ];
  return `${lines.join("\n")}\n`;
}
