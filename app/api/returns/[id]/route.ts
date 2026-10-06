import { NextResponse } from "next/server";
import { getReturn } from "@/lib/data";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taxReturn = await getReturn(id);
  if (!taxReturn) {
    return NextResponse.json({ error: "Return not found" }, { status: 404 });
  }
  return NextResponse.json({ return: taxReturn });
}
