import { demoDay } from "@/lib/clock";

/**
 * Tax year 2025 figures this console uses. Read limits and deadlines from here;
 * never type one inline. Amounts are integer cents.
 */
export const TAX_YEAR = 2025;

export const FILING_DEADLINE = demoDay("2026-04-15");
export const EXTENSION_DEADLINE = demoDay("2026-10-15");

export const EDUCATION_CREDITS = ["AOTC", "LLC"] as const;
export type EducationCredit = (typeof EDUCATION_CREDITS)[number];

export const EDUCATION_CREDIT_LABEL: Record<EducationCredit, string> = {
  AOTC: "American opportunity credit",
  LLC: "Lifetime learning credit",
};

/** AOTC: 100% of the first $2,000 and 25% of the next $2,000 of expenses, per student. */
export const AOTC_LIMITS = {
  fullRateExpenseCents: 200_000,
  partialRateExpenseCents: 200_000,
  partialRate: 0.25,
  maxCreditCents: 250_000,
} as const;

/** LLC: 20% of the first $10,000 of expenses, per return. */
export const LLC_LIMITS = {
  expenseCapCents: 1_000_000,
  rate: 0.2,
  maxCreditCents: 200_000,
} as const;

export const EDUCATION_CREDIT_MAX_CENTS: Record<EducationCredit, number> = {
  AOTC: AOTC_LIMITS.maxCreditCents,
  LLC: LLC_LIMITS.maxCreditCents,
};

export const EDUCATION_CREDIT_SCOPE: Record<EducationCredit, string> = {
  AOTC: "per student",
  LLC: "per return",
};

export function isEducationCredit(value: string): value is EducationCredit {
  return (EDUCATION_CREDITS as readonly string[]).includes(value);
}

export function educationCreditLabel(credit: string): string {
  if (!isEducationCredit(credit)) {
    throw new Error(`Unknown credit "${credit}". This console reviews AOTC and LLC only.`);
  }
  return EDUCATION_CREDIT_LABEL[credit];
}
