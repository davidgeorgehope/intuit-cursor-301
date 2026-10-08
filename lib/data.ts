import { prisma } from "@/lib/prisma";
import {
  DASHBOARD_WINDOWS,
  isAcceptedInWindow,
  percentChange,
  refundSeries,
  refundsAcceptedCents,
  reviewBreakdown,
} from "@/lib/dashboard";
import {
  OPEN_REVIEW_STATUSES,
  isOpenReviewStatus,
  type ReturnStatusFilter,
  type ReviewStatusFilter,
} from "@/lib/status";

const returnInclude = {
  filer: true,
  forms: true,
  reviews: true,
} as const;

const reviewInclude = {
  taxReturn: {
    include: {
      filer: true,
      forms: true,
    },
  },
} as const;

export async function getDashboard() {
  const [returns, reviews, filerCount] = await Promise.all([
    prisma.taxReturn.findMany({ include: returnInclude, orderBy: { lastActivityOn: "desc" } }),
    prisma.creditReview.findMany({ orderBy: { openedOn: "desc" } }),
    prisma.filer.count(),
  ]);

  const { currentStart, currentEnd, priorStart, priorEnd } = DASHBOARD_WINDOWS;
  const refundsCurrent = refundsAcceptedCents(returns, currentStart, currentEnd);
  const refundsPrior = refundsAcceptedCents(returns, priorStart, priorEnd);

  return {
    returns,
    series: refundSeries(returns, currentStart, currentEnd),
    breakdown: reviewBreakdown(reviews),
    kpis: {
      filerCount,
      refundsAcceptedCents: refundsCurrent,
      refundsChange: percentChange(refundsCurrent, refundsPrior),
      acceptedCount: returns.filter((taxReturn) =>
        isAcceptedInWindow(taxReturn, currentStart, currentEnd),
      ).length,
      extendedCount: returns.filter((taxReturn) => taxReturn.status === "EXTENDED").length,
      rejectedCount: returns.filter((taxReturn) => taxReturn.status === "REJECTED").length,
      openReviewCount: reviews.filter((review) => isOpenReviewStatus(review.status)).length,
      needsReviewCount: reviews.filter((review) => review.status === "NEEDS_REVIEW").length,
    },
  };
}

export async function getReturns(filters?: { status?: ReturnStatusFilter; q?: string }) {
  const returns = await prisma.taxReturn.findMany({
    where: { status: filters?.status === "ALL" ? undefined : filters?.status },
    include: returnInclude,
    orderBy: { lastActivityOn: "desc" },
  });

  if (!filters?.q) return returns;
  const q = filters.q.toLowerCase().trim();
  return returns.filter((taxReturn) =>
    `${taxReturn.number} ${taxReturn.filer.name} ${taxReturn.filer.state}`.toLowerCase().includes(q),
  );
}

export async function getReturn(id: string) {
  return prisma.taxReturn.findUnique({
    where: { id },
    include: returnInclude,
  });
}

export async function getRejectedReturns() {
  return prisma.taxReturn.findMany({
    where: { status: "REJECTED" },
    include: returnInclude,
    orderBy: { rejectedOn: "asc" },
  });
}

export async function getReviews(filters?: { status?: ReviewStatusFilter }) {
  return prisma.creditReview.findMany({
    where: { status: filters?.status === "ALL" ? undefined : filters?.status },
    include: reviewInclude,
    orderBy: { openedOn: "desc" },
  });
}

export async function getReview(id: string) {
  return prisma.creditReview.findUnique({
    where: { id },
    include: reviewInclude,
  });
}

export async function getOpenReviewCount() {
  return prisma.creditReview.count({
    where: { status: { in: [...OPEN_REVIEW_STATUSES] } },
  });
}

export async function getOpenReviewNotices() {
  const reviews = await prisma.creditReview.findMany({
    where: { status: { in: [...OPEN_REVIEW_STATUSES] } },
    include: { taxReturn: { include: { filer: true } } },
    orderBy: { openedOn: "desc" },
    take: 8,
  });
  return reviews.map((review) => ({
    id: review.id,
    filerName: review.taxReturn.filer.name,
    returnNumber: review.taxReturn.number,
    status: review.status,
  }));
}

export async function getWorkspace() {
  return prisma.workspace.findUniqueOrThrow({ where: { id: "ws_expertops" } });
}
