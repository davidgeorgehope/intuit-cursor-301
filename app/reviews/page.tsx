import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { FilterPills } from "@/components/filter-pills";
import { PageHeader } from "@/components/page-header";
import { ReviewStatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { getReviews } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { REVIEW_STATUS_FILTERS, isReviewStatusFilter, toReviewStatus } from "@/lib/status";
import { educationCreditLabel } from "@/lib/tax-year";

export const metadata = {
  title: "Credit reviews",
};

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "ALL";
  const reviews = isReviewStatusFilter(status) ? await getReviews({ status }) : [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Expert review"
        title="Education credit reviews"
        description="Claims an expert checks before the return is filed. The allowed credit never exceeds the tax-year limit, whatever the filer entered."
      />

      <FilterPills pathname="/reviews" value={status} items={REVIEW_STATUS_FILTERS} />

      {reviews.length === 0 ? (
        <EmptyState
          title="Nothing in this queue"
          body="Approved and declined reviews live on other filters."
          imageSrc="/images/empty-reviews.svg"
          imageAlt="Empty review queue illustration"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {reviews.map((review) => (
            <Link key={review.id} href={`/reviews/${review.id}`}>
              <Card className="h-full transition-colors hover:bg-accent/40">
                <CardContent className="space-y-3 pt-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{review.taxReturn.filer.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {review.taxReturn.number} · {review.id}
                      </p>
                    </div>
                    <ReviewStatusBadge status={toReviewStatus(review.status)} />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{review.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {educationCreditLabel(review.credit)} · opened {formatDate(review.openedOn)} · claimed{" "}
                    {formatUsd(review.claimedCents)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
