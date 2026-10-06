import type { TaxSummaryRow } from "@/lib/data";
import { returnTotals } from "@/lib/forms";

const HEADER = ["form_type", "issuer", "amount_usd", "federal_withholding_usd"];

/** Integer cents to a two-decimal dollar string, with no float math. */
function dollars(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

function field(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/** One row per form, then a totals row. Total income excludes 1098-T tuition. */
export function taxSummaryCsv(rows: readonly TaxSummaryRow[]): string {
  const totals = returnTotals(rows);
  const lines = [
    HEADER,
    ...rows.map((row) => [row.formType, row.issuer, dollars(row.amountCents), dollars(row.withheldCents)]),
    ["Total income", "", dollars(totals.incomeCents), dollars(totals.withheldCents)],
  ];
  return `${lines.map((line) => line.map(field).join(",")).join("\r\n")}\r\n`;
}
