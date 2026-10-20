import { NextResponse } from "next/server";
import { resolveReview } from "@/lib/reviews/resolve";

type ResolveAction = "approve" | "decline";

function isResolveAction(action: unknown): action is ResolveAction {
  return action === "approve" || action === "decline";
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: { action?: unknown; expertNote?: unknown };
  try {
    body = (await request.json()) as { action?: unknown; expertNote?: unknown };
  } catch {
    body = {};
  }

  if (!isResolveAction(body.action)) {
    return NextResponse.json({ error: "action must be approve or decline" }, { status: 400 });
  }

  const action = body.action;
  switch (action) {
    case "approve":
    case "decline":
      break;
    default: {
      const unhandled: never = action;
      return NextResponse.json({ error: `Unhandled action ${String(unhandled)}` }, { status: 400 });
    }
  }

  const expertNote = typeof body.expertNote === "string" ? body.expertNote : undefined;

  try {
    await resolveReview({
      reviewId: id,
      action,
      expertNote,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    // Helper throws "not implemented" until it persists. A missing id is not-found.
    if (/not found/i.test(message)) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    if (/not implemented/i.test(message)) {
      return NextResponse.json(
        {
          error: message,
          hint: "Implement lib/reviews/resolve.ts and enable the panel on app/reviews/[id]/page.tsx.",
        },
        { status: 501 },
      );
    }
    return NextResponse.json({ error: message || "Could not resolve review" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
