import { formatUsd } from "@/lib/money";
import { AOTC_LIMITS, LLC_LIMITS, type EducationCredit } from "@/lib/tax-year";

export function educationCreditRule(credit: EducationCredit): string {
  switch (credit) {
    case "AOTC":
      return `100% of the first ${formatUsd(AOTC_LIMITS.fullRateExpenseCents)} and ${AOTC_LIMITS.partialRate * 100}% of the next ${formatUsd(AOTC_LIMITS.partialRateExpenseCents)} of qualified expenses, up to ${formatUsd(AOTC_LIMITS.maxCreditCents)} per student.`;
    case "LLC":
      return `${LLC_LIMITS.rate * 100}% of the first ${formatUsd(LLC_LIMITS.expenseCapCents)} of qualified expenses, up to ${formatUsd(LLC_LIMITS.maxCreditCents)} per return.`;
    default: {
      const unhandled: never = credit;
      throw new Error(`Unhandled credit ${String(unhandled)}`);
    }
  }
}

/**
 * Allowed education credit for a review, from adjusted qualified expenses.
 * Never allows more than the tax-year limit, whatever the filer claimed.
 * MAGI phase-outs are not modeled in this demo.
 */
export function allowedEducationCreditCents(input: {
  credit: EducationCredit;
  qualifiedExpensesCents: number;
}): number {
  if (input.qualifiedExpensesCents < 0) {
    throw new Error("Qualified expenses must be non-negative cents.");
  }

  switch (input.credit) {
    case "AOTC": {
      const fullRate = Math.min(input.qualifiedExpensesCents, AOTC_LIMITS.fullRateExpenseCents);
      const partialRate = Math.min(
        Math.max(input.qualifiedExpensesCents - AOTC_LIMITS.fullRateExpenseCents, 0),
        AOTC_LIMITS.partialRateExpenseCents,
      );
      return fullRate + Math.round(partialRate * AOTC_LIMITS.partialRate);
    }
    case "LLC":
      return Math.round(
        Math.min(input.qualifiedExpensesCents, LLC_LIMITS.expenseCapCents) * LLC_LIMITS.rate,
      );
    default: {
      const unhandled: never = input.credit;
      throw new Error(`Unhandled credit ${String(unhandled)}`);
    }
  }
}
