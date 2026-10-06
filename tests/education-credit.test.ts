import { describe, expect, it } from "vitest";
import { allowedEducationCreditCents } from "@/lib/education-credit";

describe("allowedEducationCreditCents", () => {
  it("never allows more than $2,500 of AOTC per student", () => {
    expect(allowedEducationCreditCents({ credit: "AOTC", qualifiedExpensesCents: 400_000 })).toBe(250_000);
    expect(allowedEducationCreditCents({ credit: "AOTC", qualifiedExpensesCents: 900_000 })).toBe(250_000);
  });

  it("applies 100% of the first $2,000 and 25% of the next $2,000", () => {
    expect(allowedEducationCreditCents({ credit: "AOTC", qualifiedExpensesCents: 180_000 })).toBe(180_000);
    expect(allowedEducationCreditCents({ credit: "AOTC", qualifiedExpensesCents: 260_000 })).toBe(215_000);
  });

  it("allows 20% of the first $10,000 for the lifetime learning credit", () => {
    expect(allowedEducationCreditCents({ credit: "LLC", qualifiedExpensesCents: 650_000 })).toBe(130_000);
    expect(allowedEducationCreditCents({ credit: "LLC", qualifiedExpensesCents: 1_200_000 })).toBe(200_000);
  });

  it("rejects negative expenses", () => {
    expect(() => allowedEducationCreditCents({ credit: "LLC", qualifiedExpensesCents: -1 })).toThrow(
      /non-negative/,
    );
  });
});
