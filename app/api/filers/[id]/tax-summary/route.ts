import { NextResponse } from "next/server";
import { getTaxSummary } from "@/lib/data";
import { taxSummaryCsv } from "@/lib/tax-summary-csv";
import { TAX_YEAR } from "@/lib/tax-year";

const YEAR_ERROR = `year must be a four-digit tax year no later than ${TAX_YEAR}`;

function parseTaxYear(request: Request): number | null {
  const raw = new URL(request.url).searchParams.get("year");
  if (raw === null || !/^\d{4}$/.test(raw)) {
    return null;
  }
  const year = Number(raw);
  if (year > TAX_YEAR) {
    return null;
  }
  return year;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const year = parseTaxYear(request);
  if (year === null) {
    return NextResponse.json({ error: YEAR_ERROR }, { status: 400 });
  }

  const { id } = await params;
  const summary = await getTaxSummary(id, year);
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
