import { describe, expect, it } from "vitest";
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
});
