import { allowedEducationCreditCents } from "@/lib/education-credit";
import { isEducationCredit } from "@/lib/tax-year";

export type ResolveReviewInput = {
  reviewId: string;
  action: "approve" | "decline";
  expertNote?: string;
};

/**
 * Multi-file stub, unfinished on purpose.
 * Wire this helper from `app/api/reviews/[id]/resolve/route.ts`
 * and the Resolution panel on `app/reviews/[id]/page.tsx`.
 *
 * When you implement it: persist APPROVED or DECLINED and the expert note.
 * On approve, store allowedEducationCreditCents for the review's credit and
 * qualified expenses — never the claimed amount.
 */
export async function resolveReview(input: ResolveReviewInput): Promise<never> {
  // TODO(agent): load the review, recompute the allowed credit, persist APPROVED or DECLINED.
  void input;
  void allowedEducationCreditCents;
  void isEducationCredit;
  throw new Error("resolveReview is not implemented");
}
