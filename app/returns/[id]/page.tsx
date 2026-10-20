import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { displayReturnStatus } from "@/components/return-table";
import { ReturnStatusBadge, ReviewStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getReturn } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { returnTotals } from "@/lib/forms";
import { formatUsd } from "@/lib/money";
import { rejectDetail } from "@/lib/rejects";
import { filingStatusLabel } from "@/lib/status";
import { educationCreditLabel } from "@/lib/tax-year";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taxReturn = await getReturn(id);
  return { title: taxReturn ? taxReturn.number : "Return" };
}

export default async function ReturnDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { id } = await params;
  const { year: yearParam } = await searchParams;
  const taxReturn = await getReturn(id);
  if (!taxReturn) notFound();

  const { filer } = taxReturn;
  const summaryYear = yearParam?.trim() ? yearParam.trim() : String(taxReturn.taxYear);
  const taxSummaryHref = `/api/filers/${filer.id}/tax-summary?year=${encodeURIComponent(summaryYear)}`;
  const totals = returnTotals(taxReturn.forms);
  const reject = taxReturn.rejectCode ? rejectDetail(taxReturn.rejectCode) : null;
  const final = taxReturn.status === "ACCEPTED";
  const refundLabel =
    taxReturn.refundCents >= 0
      ? final
        ? "Refund"
        : "Refund estimate"
      : final
        ? "Balance due"
        : "Estimated balance due";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        eyebrow={`${taxReturn.number} · tax year ${taxReturn.taxYear}`}
        title={filer.name}
        description={`${filingStatusLabel(filer.filingStatus)} · ${filer.state} · due ${formatDate(taxReturn.dueOn)}${
          taxReturn.extendedOn ? ` · extension filed ${formatDate(taxReturn.extendedOn)}` : ""
        }`}
        actions={<ReturnStatusBadge status={displayReturnStatus(taxReturn)} />}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
        <Card className="overflow-hidden py-0">
          <CardHeader className="px-5 pt-5">
            <CardTitle>Forms on file</CardTitle>
            <CardDescription>Amounts as reported. A 1098-T is tuition paid, not income.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0 pb-4">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="border-y border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-5 py-2 font-medium">Form</th>
                  <th className="px-5 py-2 font-medium">Issuer</th>
                  <th className="px-5 py-2 text-right font-medium">Amount</th>
                  <th className="px-5 py-2 text-right font-medium">Federal withholding</th>
                </tr>
              </thead>
              <tbody>
                {taxReturn.forms.map((form) => (
                  <tr key={form.id} className="border-b border-border">
                    <td className="px-5 py-3 font-mono text-xs">{form.formType}</td>
                    <td className="px-5 py-3">{form.issuer}</td>
                    <td className="px-5 py-3 text-right">{formatUsd(form.amountCents)}</td>
                    <td className="px-5 py-3 text-right">{formatUsd(form.withheldCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-4 space-y-2 px-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total income</dt>
                <dd>{formatUsd(totals.incomeCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Federal withholding</dt>
                <dd>{formatUsd(totals.withheldCents)}</dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>{refundLabel}</dt>
                <dd>{formatUsd(Math.abs(taxReturn.refundCents))}</dd>
              </div>
            </dl>
            {taxReturn.memo ? (
              <p className="mx-5 mt-4 rounded-md bg-indigo-soft px-3 py-2 text-sm text-foreground">{taxReturn.memo}</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filer</CardTitle>
              <CardDescription>{filingStatusLabel(filer.filingStatus)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>{filer.email}</p>
              <p className="font-mono text-muted-foreground">SSN •••-••-{filer.ssnLast4}</p>
              <p className="text-muted-foreground">State of residence: {filer.state}</p>
            </CardContent>
          </Card>

          {reject && taxReturn.rejectedOn ? (
            <Card className="border-danger/40">
              <CardHeader>
                <CardTitle>E-file reject</CardTitle>
                <CardDescription className="font-mono">
                  {taxReturn.rejectCode} · {formatDate(taxReturn.rejectedOn)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{reject.summary}</p>
                <p className="text-muted-foreground">{reject.fix}</p>
              </CardContent>
            </Card>
          ) : null}

          {taxReturn.reviews.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Credit reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {taxReturn.reviews.map((review) => (
                  <Link key={review.id} href={`/reviews/${review.id}`} className="block text-sm hover:underline">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs">{review.id}</span>
                      <ReviewStatusBadge status={review.status} />
                    </div>
                    <p className="mt-1 text-muted-foreground">{educationCreditLabel(review.credit)}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <a href={taxSummaryHref}>Download tax summary (CSV)</a>
        </Button>
        <Button asChild variant="outline">
          <Link href="/returns">Back to returns</Link>
        </Button>
      </div>
    </div>
  );
}
