import { describe, expect, it } from "vitest";
import {
  RETURN_STATUSES,
  RETURN_STATUS_FILTERS,
  REVIEW_STATUSES,
  REVIEW_STATUS_FILTERS,
  returnStatusLabel,
  reviewStatusLabel,
  toReturnStatus,
  toReviewStatus,
} from "@/lib/status";

describe("status labels", () => {
  it("labels every return and review status", () => {
    expect(Object.fromEntries(RETURN_STATUSES.map((status) => [status, returnStatusLabel(status)]))).toEqual({
      EXTENDED: "Extended",
      READY: "Ready to file",
      TRANSMITTED: "Transmitted",
      ACCEPTED: "Accepted",
      REJECTED: "Rejected",
    });
    expect(returnStatusLabel("IN_REVIEW")).toBe("In review");
    expect(Object.fromEntries(REVIEW_STATUSES.map((status) => [status, reviewStatusLabel(status)]))).toEqual({
      OPEN: "Open",
      NEEDS_REVIEW: "Needs review",
      APPROVED: "Approved",
      DECLINED: "Declined",
    });
  });

  it("keeps the filter pills the pages showed", () => {
    expect(RETURN_STATUS_FILTERS).toEqual([
      { id: "ALL", label: "All" },
      { id: "EXTENDED", label: "Extended" },
      { id: "READY", label: "Ready to file" },
      { id: "TRANSMITTED", label: "Transmitted" },
      { id: "ACCEPTED", label: "Accepted" },
      { id: "REJECTED", label: "Rejected" },
    ]);
    expect(REVIEW_STATUS_FILTERS).toEqual([
      { id: "ALL", label: "All" },
      { id: "NEEDS_REVIEW", label: "Needs review" },
      { id: "OPEN", label: "Open" },
      { id: "APPROVED", label: "Approved" },
      { id: "DECLINED", label: "Declined" },
    ]);
  });

  it("refuses a stored status outside the set", () => {
    expect(toReturnStatus("ACCEPTED")).toBe("ACCEPTED");
    expect(() => toReturnStatus("AMENDED")).toThrow("Unknown return status: AMENDED");
    expect(toReviewStatus("OPEN")).toBe("OPEN");
    expect(() => toReviewStatus("CLOSED")).toThrow("Unknown review status: CLOSED");
  });
});
