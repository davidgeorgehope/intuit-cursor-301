export const RETURN_STATUSES = ["EXTENDED", "READY", "TRANSMITTED", "ACCEPTED", "REJECTED"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

/** Display-only status for a return that has an open credit review. Never stored. */
export type ReturnDisplayStatus = ReturnStatus | "IN_REVIEW";

/** Queue order: the reviews page lists its filters in this order. */
export const REVIEW_STATUSES = ["NEEDS_REVIEW", "OPEN", "APPROVED", "DECLINED"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const OPEN_REVIEW_STATUSES = ["OPEN", "NEEDS_REVIEW"] as const satisfies readonly ReviewStatus[];

/** "ALL" is a filter value only. It is never stored. */
export type ReturnStatusFilter = ReturnStatus | "ALL";
export type ReviewStatusFilter = ReviewStatus | "ALL";

export const FILING_STATUSES = ["SINGLE", "MFJ", "MFS", "HOH", "QSS"] as const;
export type FilingStatus = (typeof FILING_STATUSES)[number];

export function isReturnStatus(value: string): value is ReturnStatus {
  return (RETURN_STATUSES as readonly string[]).includes(value);
}

export function isReviewStatus(value: string): value is ReviewStatus {
  return (REVIEW_STATUSES as readonly string[]).includes(value);
}

export function isReturnStatusFilter(value: string): value is ReturnStatusFilter {
  return value === "ALL" || isReturnStatus(value);
}

export function isReviewStatusFilter(value: string): value is ReviewStatusFilter {
  return value === "ALL" || isReviewStatus(value);
}

/** Narrows a stored status. A value outside the set throws instead of rendering as a raw code. */
export function toReturnStatus(value: string): ReturnStatus {
  if (isReturnStatus(value)) return value;
  throw new Error(`Unknown return status: ${value}`);
}

export function toReviewStatus(value: string): ReviewStatus {
  if (isReviewStatus(value)) return value;
  throw new Error(`Unknown review status: ${value}`);
}

export function isOpenReviewStatus(value: string): boolean {
  return (OPEN_REVIEW_STATUSES as readonly string[]).includes(value);
}

export function returnStatusLabel(status: ReturnDisplayStatus): string {
  switch (status) {
    case "EXTENDED":
      return "Extended";
    case "READY":
      return "Ready to file";
    case "TRANSMITTED":
      return "Transmitted";
    case "ACCEPTED":
      return "Accepted";
    case "REJECTED":
      return "Rejected";
    case "IN_REVIEW":
      return "In review";
    default: {
      const unhandled: never = status;
      throw new Error(`Unhandled return status ${String(unhandled)}`);
    }
  }
}

export function reviewStatusLabel(status: ReviewStatus): string {
  switch (status) {
    case "OPEN":
      return "Open";
    case "NEEDS_REVIEW":
      return "Needs review";
    case "APPROVED":
      return "Approved";
    case "DECLINED":
      return "Declined";
    default: {
      const unhandled: never = status;
      throw new Error(`Unhandled review status ${String(unhandled)}`);
    }
  }
}

export const RETURN_STATUS_FILTERS: { id: ReturnStatusFilter; label: string }[] = [
  { id: "ALL", label: "All" },
  ...RETURN_STATUSES.map((status) => ({ id: status, label: returnStatusLabel(status) })),
];

export const REVIEW_STATUS_FILTERS: { id: ReviewStatusFilter; label: string }[] = [
  { id: "ALL", label: "All" },
  ...REVIEW_STATUSES.map((status) => ({ id: status, label: reviewStatusLabel(status) })),
];

export function filingStatusLabel(status: string): string {
  switch (status) {
    case "SINGLE":
      return "Single";
    case "MFJ":
      return "Married filing jointly";
    case "MFS":
      return "Married filing separately";
    case "HOH":
      return "Head of household";
    case "QSS":
      return "Qualifying surviving spouse";
    default:
      return status;
  }
}
