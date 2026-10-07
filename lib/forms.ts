import { sumCents } from "@/lib/money";

export const FORM_TYPES = ["W-2", "1099-INT", "1098-T"] as const;
export type FormType = (typeof FORM_TYPES)[number];

/** A 1098-T reports tuition paid, not income. It feeds education credits only. */
export function countsAsIncome(formType: string): boolean {
  return formType === "W-2" || formType === "1099-INT";
}

export function returnTotals(
  forms: readonly { formType: string; amountCents: number; withheldCents: number }[],
) {
  return {
    incomeCents: sumCents(
      forms.filter((form) => countsAsIncome(form.formType)).map((form) => form.amountCents),
    ),
    withheldCents: sumCents(forms.map((form) => form.withheldCents)),
  };
}
