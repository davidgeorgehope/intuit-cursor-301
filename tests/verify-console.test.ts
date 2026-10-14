import { describe, expect, it } from "vitest";
import { checkCreditReview, checkRejectsPage, checkReturnsApi } from "@/lib/verify-console";

describe("verify console", () => {
  it("accepts a seeded returns payload with no SSN-shaped number", () => {
    const check = checkReturnsApi(200, { returns: [{ id: "ret_1042", filer: { ssnLast4: "3307" } }] });
    expect(check.pass).toBe(true);
  });

  it("rejects an SSN-shaped number in the payload", () => {
    const check = checkReturnsApi(200, { returns: [{ note: "000-00-0000" }] });
    expect(check.pass).toBe(false);
  });

  it("requires 7 days left on the rejects page", () => {
    expect(checkRejectsPage(200, "Rejected returns 7 days left").pass).toBe(true);
    expect(checkRejectsPage(200, "Rejected returns 6 days left").pass).toBe(false);
  });

  it("keeps the $4,000 claim under a $2,500 allowed credit", () => {
    const html = "Allowed credit $2,500.00 The filer claimed $4,000.00.";
    expect(checkCreditReview(200, html).pass).toBe(true);
    expect(checkCreditReview(200, "Allowed credit $4,000.00").pass).toBe(false);
  });
});
