export const RETURN_STATUSES = ["EXTENDED", "READY", "TRANSMITTED", "ACCEPTED", "REJECTED"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

/** Display-only status for a return that has an open credit review. Never stored. */
export type ReturnDisplayStatus = ReturnStatus | "IN_REVIEW";

export const REVIEW_STATUSES = ["OPEN", "NEEDS_REVIEW", "APPROVED", "DECLINED"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const OPEN_REVIEW_STATUSES = ["OPEN", "NEEDS_REVIEW"] as const satisfies readonly ReviewStatus[];

export const FILING_STATUSES = ["SINGLE", "MFJ", "MFS", "HOH", "QSS"] as const;
export type FilingStatus = (typeof FILING_STATUSES)[number];

export function isReturnStatus(value: string): value is ReturnStatus {
  return (RETURN_STATUSES as readonly string[]).includes(value);
}

export function isReviewStatus(value: string): value is ReviewStatus {
  return (REVIEW_STATUSES as readonly string[]).includes(value);
}

export function isOpenReviewStatus(value: string): boolean {
  return (OPEN_REVIEW_STATUSES as readonly string[]).includes(value);
}

export function returnStatusLabel(status: string): string {
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
    default:
      return status;
  }
}

export function reviewStatusLabel(status: string): string {
  switch (status) {
    case "OPEN":
      return "Open";
    case "NEEDS_REVIEW":
      return "Needs review";
    case "APPROVED":
      return "Approved";
    case "DECLINED":
      return "Declined";
    default:
      return status;
  }
}

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
