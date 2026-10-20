import { allowedEducationCreditCents } from "@/lib/education-credit";
import { prisma } from "@/lib/prisma";
import { isEducationCredit } from "@/lib/tax-year";

export type ResolveReviewInput = {
  reviewId: string;
  action: "approve" | "decline";
  expertNote?: string;
};

/**
 * Persist APPROVED or DECLINED and the optional expert note.
 * On approve, store the allowed education credit for the review's credit
 * and qualified expenses — never the claimed amount.
 */
export async function resolveReview(input: ResolveReviewInput): Promise<void> {
  const review = await prisma.creditReview.findUnique({
    where: { id: input.reviewId },
    select: { credit: true, qualifiedExpensesCents: true },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  if (!isEducationCredit(review.credit)) {
    throw new Error(`Unknown credit "${review.credit}". This console reviews AOTC and LLC only.`);
  }

  switch (input.action) {
    case "approve": {
      await prisma.creditReview.update({
        where: { id: input.reviewId },
        data: {
          status: "APPROVED",
          expertNote: input.expertNote,
          allowedCreditCents: allowedEducationCreditCents({
            credit: review.credit,
            qualifiedExpensesCents: review.qualifiedExpensesCents,
          }),
        },
      });
      return;
    }
    case "decline": {
      await prisma.creditReview.update({
        where: { id: input.reviewId },
        data: {
          status: "DECLINED",
          expertNote: input.expertNote,
        },
      });
      return;
    }
    default: {
      const unhandled: never = input.action;
      throw new Error(`Unhandled action ${String(unhandled)}`);
    }
  }
}
