import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { returnStatusLabel, reviewStatusLabel, type ReturnDisplayStatus, type ReviewStatus } from "@/lib/status";

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

const RETURN_STATUS_VARIANTS = {
  EXTENDED: "warning",
  READY: "secondary",
  TRANSMITTED: "muted",
  ACCEPTED: "success",
  REJECTED: "danger",
  IN_REVIEW: "danger",
} as const satisfies Record<ReturnDisplayStatus, BadgeVariant>;

const REVIEW_STATUS_VARIANTS = {
  NEEDS_REVIEW: "danger",
  OPEN: "warning",
  APPROVED: "success",
  DECLINED: "muted",
} as const satisfies Record<ReviewStatus, BadgeVariant>;

export function ReturnStatusBadge({ status }: { status: ReturnDisplayStatus }) {
  return <Badge variant={RETURN_STATUS_VARIANTS[status]}>{returnStatusLabel(status)}</Badge>;
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return <Badge variant={REVIEW_STATUS_VARIANTS[status]}>{reviewStatusLabel(status)}</Badge>;
}
