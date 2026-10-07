import { NextResponse } from "next/server";
import { resolveReview } from "@/lib/reviews/resolve";

/**
 * Multi-file stub. Accepts { action: "approve" | "decline", expertNote?: string }
 * and persists via resolveReview. Returns 501 until that helper is implemented.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: { action?: string; expertNote?: string } = {};
  try {
    body = (await request.json()) as { action?: string; expertNote?: string };
  } catch {
    body = {};
  }

  if (body.action !== "approve" && body.action !== "decline") {
    return NextResponse.json({ error: "action must be approve or decline" }, { status: 400 });
  }

  try {
    await resolveReview({
      reviewId: id,
      action: body.action,
      expertNote: body.expertNote,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Not implemented";
    return NextResponse.json(
      {
        error: message,
        hint: "Implement lib/reviews/resolve.ts and enable the panel on app/reviews/[id]/page.tsx.",
      },
      { status: 501 },
    );
  }
}
