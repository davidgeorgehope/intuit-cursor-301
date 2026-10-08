import { describe, expect, it } from "vitest";
import { RETURN_STATUSES, REVIEW_STATUSES, returnStatusLabel, reviewStatusLabel } from "@/lib/status";

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
});
