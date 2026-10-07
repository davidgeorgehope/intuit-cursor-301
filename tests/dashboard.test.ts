import { describe, expect, it } from "vitest";
import { demoDay } from "@/lib/clock";
import { percentChange, refundsAcceptedCents } from "@/lib/dashboard";

describe("refundsAcceptedCents", () => {
  const start = demoDay("2026-09-08");
  const end = demoDay("2026-10-08");

  it("sums refunds accepted in the window and skips balances due", () => {
    expect(
      refundsAcceptedCents(
        [
          { status: "ACCEPTED", acceptedOn: demoDay("2026-09-15"), refundCents: 254_900 },
          { status: "ACCEPTED", acceptedOn: demoDay("2026-09-24"), refundCents: -97_400 },
          { status: "ACCEPTED", acceptedOn: demoDay("2026-04-03"), refundCents: 138_100 },
          { status: "TRANSMITTED", acceptedOn: null, refundCents: 140_700 },
        ],
        start,
        end,
      ),
    ).toBe(254_900);
  });
});

describe("percentChange", () => {
  it("returns null when the prior period is empty and current is not", () => {
    expect(percentChange(44_100, 0)).toBeNull();
  });

  it("computes a real lift without inventing a baseline", () => {
    expect(percentChange(88_200, 44_100)).toBe(100);
  });
});
