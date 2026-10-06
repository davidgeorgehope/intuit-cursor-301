"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { ReviewStatusBadge } from "@/components/status-badge";

export type OpenReviewNotice = {
  id: string;
  filerName: string;
  returnNumber: string;
  status: string;
};

export function NoticeBell({
  openReviewCount,
  openReviews,
}: {
  openReviewCount: number;
  openReviews: OpenReviewNotice[];
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Open credit reviews"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="size-5" />
        {openReviewCount > 0 ? (
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-danger" />
        ) : null}
      </button>
      {open ? (
        <div className="absolute top-11 right-0 z-30 w-80 rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-[var(--shadow-card)]">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Open credit reviews
          </p>
          {openReviews.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No credit reviews are waiting.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {openReviews.map((review) => (
                <li key={review.id}>
                  <Link
                    href={`/reviews/${review.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start justify-between gap-2 rounded-lg px-2 py-2 hover:bg-muted"
                  >
                    <span>
                      <span className="block text-sm font-medium">{review.filerName}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {review.returnNumber} · {review.id}
                      </span>
                    </span>
                    <ReviewStatusBadge status={review.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/reviews"
            onClick={() => setOpen(false)}
            className="mt-2 inline-block px-2 text-xs font-medium text-indigo hover:underline"
          >
            Review queue →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
