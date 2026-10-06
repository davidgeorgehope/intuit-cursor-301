import { describe, expect, it } from "vitest";
import {
  EDUCATION_CREDIT_MAX_CENTS,
  EXTENSION_DEADLINE,
  FILING_DEADLINE,
  TAX_YEAR,
  educationCreditLabel,
} from "@/lib/tax-year";

describe("tax year 2025", () => {
  it("keeps the filing and extension deadlines", () => {
    expect(TAX_YEAR).toBe(2025);
    expect(FILING_DEADLINE.toISOString().slice(0, 10)).toBe("2026-04-15");
    expect(EXTENSION_DEADLINE.toISOString().slice(0, 10)).toBe("2026-10-15");
  });

  it("caps education credits at the 2025 limits", () => {
    expect(EDUCATION_CREDIT_MAX_CENTS).toEqual({ AOTC: 250_000, LLC: 200_000 });
  });

  it("refuses a credit this console does not review", () => {
    expect(educationCreditLabel("AOTC")).toBe("American opportunity credit");
    expect(() => educationCreditLabel("EITC")).toThrow(/Unknown credit/);
  });
});
