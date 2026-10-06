import type { ReactNode } from "react";
import { AppChrome } from "@/components/app-chrome";
import { getOpenReviewCount, getOpenReviewNotices } from "@/lib/data";

export async function AppShell({ children }: { children: ReactNode }) {
  let openReviewCount = 0;
  let openReviews: Awaited<ReturnType<typeof getOpenReviewNotices>> = [];
  try {
    [openReviewCount, openReviews] = await Promise.all([getOpenReviewCount(), getOpenReviewNotices()]);
  } catch {
    openReviewCount = 0;
    openReviews = [];
  }

  return (
    <AppChrome openReviewCount={openReviewCount} openReviews={openReviews}>
      {children}
    </AppChrome>
  );
}
