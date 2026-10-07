import { Badge } from "@/components/ui/badge";
import { returnStatusLabel, reviewStatusLabel } from "@/lib/status";

export function ReturnStatusBadge({ status }: { status: string }) {
  const variant =
    status === "ACCEPTED"
      ? "success"
      : status === "REJECTED" || status === "IN_REVIEW"
        ? "danger"
        : status === "EXTENDED"
          ? "warning"
          : status === "TRANSMITTED"
            ? "muted"
            : "secondary";

  return <Badge variant={variant}>{returnStatusLabel(status)}</Badge>;
}

export function ReviewStatusBadge({ status }: { status: string }) {
  const variant =
    status === "NEEDS_REVIEW"
      ? "danger"
      : status === "APPROVED"
        ? "success"
        : status === "DECLINED"
          ? "muted"
          : "warning";

  return <Badge variant={variant}>{reviewStatusLabel(status)}</Badge>;
}
