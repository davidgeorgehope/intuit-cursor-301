"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ResolveAction = "approve" | "decline";

export function ResolutionPanel({
  reviewId,
  expertNote,
}: {
  reviewId: string;
  expertNote: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState(expertNote);
  const [pending, setPending] = useState<ResolveAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolve(action: ResolveAction) {
    setPending(action);
    setError(null);
    const body = { action, expertNote: note.trim() };
    try {
      const response = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? "Could not save this decision.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not save this decision.");
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <Label htmlFor="expert-note">Expert note</Label>
      <Textarea
        id="expert-note"
        name="expertNote"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Optional note for the file."
      />
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void resolve("approve")} disabled={pending !== null}>
          Approve credit
        </Button>
        <Button type="button" variant="outline" onClick={() => void resolve("decline")} disabled={pending !== null}>
          Decline
        </Button>
      </div>
    </>
  );
}
