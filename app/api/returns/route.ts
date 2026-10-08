import { NextResponse } from "next/server";
import { getReturns } from "@/lib/data";
import { RETURN_STATUSES, isReturnStatusFilter } from "@/lib/status";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "ALL";
  if (!isReturnStatusFilter(status)) {
    return NextResponse.json(
      { error: `status must be one of ALL, ${RETURN_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }
  const returns = await getReturns({
    status,
    q: url.searchParams.get("q") ?? undefined,
  });
  return NextResponse.json({ returns });
}
