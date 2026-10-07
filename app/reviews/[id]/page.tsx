import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ReturnStatusBadge, ReviewStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

      {/*
        MULTI-FILE STUB
        Complete together:
          1. lib/reviews/resolve.ts
          2. app/api/reviews/[id]/resolve/route.ts
          3. this panel — enable Approve / Decline and persist an expert note
      */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Resolution</CardTitle>
          <CardDescription>
            This panel is unfinished. Approve and Decline should call{" "}
            <span className="font-mono text-foreground">POST /api/reviews/{review.id}/resolve</span> once the
            helper exists. Never allow more than {formatUsd(limit)} {EDUCATION_CREDIT_SCOPE[review.credit]}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={cn("rounded-md px-3 py-2", overClaimed ? "bg-danger-soft" : "bg-indigo-soft")}>
            <p className="text-lg font-semibold tracking-tight">
              Allowed credit {formatUsd(review.allowedCreditCents)}
            </p>
            <p className={cn("text-xs", overClaimed ? "text-danger" : "text-muted-foreground")}>
              {overClaimed
                ? `The filer claimed ${formatUsd(review.claimedCents)}. `
                : ""}
              {educationCreditLabel(review.credit)}: {educationCreditRule(review.credit)}
            </p>
          </div>

          <Label htmlFor="expert-note">Expert note</Label>
          <Textarea
            id="expert-note"
            placeholder="TODO(agent): bind this to resolveReview and store the allowed credit, never the claim."
            defaultValue={review.expertNote ?? ""}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled title="Not wired — multi-file stub">
              Approve credit
            </Button>
            <Button type="button" variant="outline" disabled title="Not wired — multi-file stub">
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
