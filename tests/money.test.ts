import { describe, expect, it } from "vitest";
import { formatUsd, sumCents } from "@/lib/money";

describe("formatUsd", () => {
  it("formats refunds and credit limits from cents", () => {
    expect(formatUsd(138_100)).toBe("$1,381.00");
    expect(formatUsd(250_000)).toBe("$2,500.00");
    expect(formatUsd(-110_900)).toBe("-$1,109.00");
  });
});

describe("sumCents", () => {
  it("adds amounts without inventing a unit", () => {
    expect(sumCents([684_000, 31_000])).toBe(715_000);
  });
});
