import { NextResponse } from "next/server";
import { getReturns } from "@/lib/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returns = await getReturns({
    status: url.searchParams.get("status") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });
  return NextResponse.json({ returns });
}
