import { NextResponse } from "next/server";
import { getReviews } from "@/lib/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reviews = await getReviews({
    status: url.searchParams.get("status") ?? undefined,
  });
  return NextResponse.json({ reviews });
}
