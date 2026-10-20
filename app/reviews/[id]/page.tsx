import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ResolutionPanel } from "@/components/reviews/resolution-panel";
import { ReturnStatusBadge, ReviewStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getReview } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { educationCreditRule } from "@/lib/education-credit";
import { formatRefund, formatUsd } from "@/lib/money";
import { EDUCATION_CREDIT_MAX_CENTS, EDUCATION_CREDIT_SCOPE, educationCreditLabel, isEducationCredit } from "@/lib/tax-year";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = await getReview(id);
  return { title: review ? `Review ${review.id}` : "Credit review" };
}

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = await getReview(id);
  if (!review) notFound();
  if (!isEducationCredit(review.credit)) notFound();

  const { taxReturn } = review;
  const limit = EDUCATION_CREDIT_MAX_CENTS[review.credit];
  const overClaimed = review.claimedCents > review.allowedCreditCents;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        eyebrow="Credit review"
        title={taxReturn.filer.name}
        description={`${taxReturn.number} · ${educationCreditLabel(review.credit)} · opened ${formatDate(review.openedOn)}`}
        actions={<ReviewStatusBadge status={review.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Why it was opened</CardTitle>
            <CardDescription>Seeded language. Do not replace this with a real taxpayer story.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>{review.reason}</p>
            <p className="text-muted-foreground">
              Claimed {formatUsd(review.claimedCents)} on {formatUsd(review.qualifiedExpensesCents)} of qualified
              expenses.
            </p>
            {review.expertNote ? (
              <p className="rounded-md bg-indigo-soft px-3 py-2 text-foreground">{review.expertNote}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Return</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <ReturnStatusBadge status={taxReturn.status} />
              <span>{formatRefund(taxReturn.refundCents)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {taxReturn.memo ? <p>{taxReturn.memo}</p> : null}
            <Button asChild variant="outline" size="sm">
              <Link href={`/returns/${taxReturn.id}`}>Open {taxReturn.number}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resolution</CardTitle>
          <CardDescription>
            Approve or decline, and save an expert note. Allowed credit stays within {formatUsd(limit)}{" "}
            {EDUCATION_CREDIT_SCOPE[review.credit]}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={cn("rounded-md px-3 py-2", overClaimed ? "bg-danger-soft" : "bg-indigo-soft")}>
            <p className="text-lg font-semibold tracking-tight">
              Allowed credit {formatUsd(review.allowedCreditCents)}
            </p>
            <p className={cn("text-xs", overClaimed ? "text-danger" : "text-muted-foreground")}>
              {overClaimed ? `The filer claimed ${formatUsd(review.claimedCents)}. ` : ""}
              {educationCreditLabel(review.credit)}: {educationCreditRule(review.credit)}
            </p>
          </div>

          <ResolutionPanel
            key={`${review.status}:${review.expertNote ?? ""}`}
            reviewId={review.id}
            expertNote={review.expertNote ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
