import { NextResponse } from "next/server";
import { getReviews } from "@/lib/data";
import { REVIEW_STATUSES, isReviewStatusFilter } from "@/lib/status";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "ALL";
  if (!isReviewStatusFilter(status)) {
    return NextResponse.json(
      { error: `status must be one of ALL, ${REVIEW_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }
  const reviews = await getReviews({ status });
  return NextResponse.json({ reviews });
}
