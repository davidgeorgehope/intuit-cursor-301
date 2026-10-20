import { prisma } from "@/lib/prisma";
import {
  DASHBOARD_WINDOWS,
  isAcceptedInWindow,
  percentChange,
  refundSeries,
  refundsAcceptedCents,
  reviewBreakdown,
} from "@/lib/dashboard";
import { OPEN_REVIEW_STATUSES, isOpenReviewStatus } from "@/lib/status";

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

export async function getReturns(filters?: { status?: string; q?: string }) {
  const returns = await prisma.taxReturn.findMany({
    include: returnInclude,
    orderBy: { lastActivityOn: "desc" },
  });

  return returns.filter((taxReturn) => {
    if (filters?.status && filters.status !== "ALL" && taxReturn.status !== filters.status) {
      return false;
    }
    if (filters?.q) {
      const haystack = `${taxReturn.number} ${taxReturn.filer.name} ${taxReturn.filer.state}`.toLowerCase();
      if (!haystack.includes(filters.q.toLowerCase().trim())) {
        return false;
      }
    }
    return true;
  });
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

export async function getReviews(filters?: { status?: string }) {
  const reviews = await prisma.creditReview.findMany({
    include: reviewInclude,
    orderBy: { openedOn: "desc" },
  });

  if (!filters?.status || filters.status === "ALL") {
    return reviews;
  }
  return reviews.filter((review) => review.status === filters.status);
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

export type TaxSummaryRow = {
  formType: string;
  issuer: string;
  amountCents: number;
  withheldCents: number;
};

/** One row per form. Totals stay in returnTotals; this does not append a totals row. */
export async function getTaxSummary(
  filerId: string,
  taxYear: number,
): Promise<{ filerId: string; filerName: string; taxYear: number; rows: TaxSummaryRow[] } | null> {
  const filer = await prisma.filer.findUnique({
    where: { id: filerId },
    select: {
      id: true,
      name: true,
      returns: {
        where: { taxYear },
        orderBy: { id: "asc" },
        select: {
          forms: {
            orderBy: { id: "asc" },
            select: {
              formType: true,
              issuer: true,
              amountCents: true,
              withheldCents: true,
            },
          },
        },
      },
    },
  });

  if (!filer) {
    return null;
  }

  return {
    filerId: filer.id,
    filerName: filer.name,
    taxYear,
    rows: filer.returns.flatMap((taxReturn) => taxReturn.forms),
  };
}
