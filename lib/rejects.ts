/**
 * IRS e-file business-rule rejects this console knows how to route.
 * Only real IRS rule codes belong here — never invent one.
 */
export const REJECT_CODES = {
  "IND-031-04": {
    summary: "Primary taxpayer's prior-year AGI or Self-Select PIN doesn't match IRS records.",
    fix: "Confirm last year's AGI exactly as filed on Form 1040, line 11, or use this year's IP PIN, then resubmit.",
  },
  "IND-032-04": {
    summary: "Spouse's prior-year AGI or Self-Select PIN doesn't match IRS records.",
    fix: "Confirm the spouse's prior-year AGI exactly as filed, or use the spouse's IP PIN, then resubmit.",
  },
  "IND-181-01": {
    summary: "Primary taxpayer was issued an Identity Protection PIN, and it is missing.",
    fix: "Enter the 2025 IP PIN from the CP01A letter or the filer's IRS online account. Prior-year PINs don't work.",
  },
} as const;

export type RejectCode = keyof typeof REJECT_CODES;

export function isRejectCode(value: string): value is RejectCode {
  return Object.hasOwn(REJECT_CODES, value);
}

export function rejectDetail(code: string) {
  return isRejectCode(code) ? REJECT_CODES[code] : null;
}
