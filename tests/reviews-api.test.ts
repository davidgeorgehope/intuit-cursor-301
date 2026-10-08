import { describe, expect, it } from "vitest";
import { GET as getReviews } from "@/app/api/reviews/route";
import { GET as getReview } from "@/app/api/reviews/[id]/route";
import { POST as resolveReview } from "@/app/api/reviews/[id]/resolve/route";

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("credit reviews API", () => {
  it("stores the capped credit, not the $4,000 claim", async () => {
    const response = await getReview(new Request("http://localhost/api/reviews/rev_1043"), params("rev_1043"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.review).toMatchObject({
      id: "rev_1043",
      credit: "AOTC",
      claimedCents: 400_000,
      allowedCreditCents: 250_000,
    });
  });

  it("returns 404 when the review is missing", async () => {
    const response = await getReview(new Request("http://localhost/api/reviews/rev_missing"), params("rev_missing"));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Review not found" });
  });

  it("rejects an unknown resolve action", async () => {
    const response = await resolveReview(
      new Request("http://localhost/api/reviews/rev_1043/resolve", {
        method: "POST",
        body: JSON.stringify({ action: "accept" }),
      }),
      params("rev_1043"),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "action must be approve or decline" });
  });

  it("filters the queue by every status", async () => {
    const seeded = { ALL: 5, NEEDS_REVIEW: 2, OPEN: 2, APPROVED: 1, DECLINED: 0 };
    for (const [status, count] of Object.entries(seeded)) {
      const response = await getReviews(new Request(`http://localhost/api/reviews?status=${status}`));
      expect(response.status, status).toBe(200);
      const { reviews } = await response.json();
      expect(reviews, status).toHaveLength(count);
      if (status !== "ALL") {
        expect(reviews.every((review: { status: string }) => review.status === status), status).toBe(true);
      }
    }
  });

  it("answers an unknown status with an empty list", async () => {
    const response = await getReviews(new Request("http://localhost/api/reviews?status=CLOSED"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ reviews: [] });
  });
});
