import { DEMO_AS_OF, DEMO_PRIOR_END, DEMO_PRIOR_START, DEMO_WINDOW_START } from "@/lib/clock";
import { sumCents } from "@/lib/money";
import { reviewStatusLabel } from "@/lib/status";

type ReturnLike = {
  status: string;
  acceptedOn: Date | null;
  refundCents: number;
};

type ReviewLike = {
  status: string;
};

export function isAcceptedInWindow(taxReturn: ReturnLike, start: Date, end: Date) {
  return Boolean(
    taxReturn.status === "ACCEPTED" &&
      taxReturn.acceptedOn &&
      taxReturn.acceptedOn >= start &&
      taxReturn.acceptedOn <= end,
  );
}

/** Balance-due returns are not refunds and never reduce the total. */
export function refundsAcceptedCents(returns: ReturnLike[], start: Date, end: Date) {
  return sumCents(
    returns
      .filter((taxReturn) => isAcceptedInWindow(taxReturn, start, end) && taxReturn.refundCents > 0)
      .map((taxReturn) => taxReturn.refundCents),
  );
}

export function percentChange(current: number, prior: number): number | null {
  if (prior === 0) return current === 0 ? 0 : null;
  return ((current - prior) / prior) * 100;
}

export function refundSeries(returns: ReturnLike[], start: Date, end: Date) {
  const points: { date: string; cents: number }[] = [];
  const cursor = new Date(start);
  let running = 0;
  const accepted = returns
    .filter(
      (taxReturn) =>
        isAcceptedInWindow(taxReturn, start, end) && taxReturn.acceptedOn && taxReturn.refundCents > 0,
    )
    .sort((a, b) => a.acceptedOn!.getTime() - b.acceptedOn!.getTime());
  let index = 0;

  while (cursor <= end) {
    while (index < accepted.length && accepted[index].acceptedOn! <= cursor) {
      running += accepted[index].refundCents;
      index += 1;
    }
    points.push({ date: cursor.toISOString().slice(0, 10), cents: running });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return points;
}

export function reviewBreakdown(reviews: ReviewLike[]) {
  const needsReview = reviews.filter((review) => review.status === "NEEDS_REVIEW").length;
  const open = reviews.filter((review) => review.status === "OPEN").length;
  const resolved = reviews.filter(
    (review) => review.status === "APPROVED" || review.status === "DECLINED",
  ).length;
  return [
    { id: "needs", label: reviewStatusLabel("NEEDS_REVIEW"), count: needsReview, color: "#dc2626" },
    { id: "open", label: reviewStatusLabel("OPEN"), count: open, color: "#d97706" },
    { id: "resolved", label: "Resolved", count: resolved, color: "#4f46e5" },
  ] as const;
}

export const DASHBOARD_WINDOWS = {
  currentStart: DEMO_WINDOW_START,
  currentEnd: DEMO_AS_OF,
  priorStart: DEMO_PRIOR_START,
  priorEnd: DEMO_PRIOR_END,
};
