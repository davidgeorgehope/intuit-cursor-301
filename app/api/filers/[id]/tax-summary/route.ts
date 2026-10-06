import { NextResponse } from "next/server";
import { getTaxSummary } from "@/lib/data";
import { taxSummaryCsv } from "@/lib/tax-summary-csv";
import { TAX_YEAR } from "@/lib/tax-year";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const year = new URL(request.url).searchParams.get("year") ?? "";
  if (!/^\d{4}$/.test(year) || Number(year) > TAX_YEAR) {
    return NextResponse.json(
      { error: `year must be a four-digit tax year no later than ${TAX_YEAR}` },
      { status: 400 },
    );
  }

  const summary = await getTaxSummary(id, Number(year));
  if (!summary) {
    return NextResponse.json({ error: "Filer not found" }, { status: 404 });
  }

  return new Response(taxSummaryCsv(summary.rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tax-summary-${summary.filerId}-${summary.taxYear}.csv"`,
    },
  });
}
