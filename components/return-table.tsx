import Link from "next/link";
import { FileText, MoreHorizontal } from "lucide-react";
import { ReturnStatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import { formatRefund } from "@/lib/money";
import { filingStatusLabel, isOpenReviewStatus, toReturnStatus, type ReturnDisplayStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

type ReturnRow = {
  id: string;
  number: string;
  status: string;
  lastActivityOn: Date;
  refundCents: number;
  filer: { name: string; filingStatus: string; state: string };
  reviews: { id: string; status: string }[];
};

export function displayReturnStatus(taxReturn: Pick<ReturnRow, "status" | "reviews">): ReturnDisplayStatus {
  const status = toReturnStatus(taxReturn.status);
  const openReview = taxReturn.reviews.some((review) => isOpenReviewStatus(review.status));
  if (openReview && (status === "EXTENDED" || status === "READY")) {
    return "IN_REVIEW";
  }
  return status;
}

export function ReturnTable({ returns }: { returns: ReturnRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Return</TableHead>
          <TableHead>Filer</TableHead>
          <TableHead>Filing status</TableHead>
          <TableHead>Last activity</TableHead>
          <TableHead className="text-right">Refund</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {returns.map((taxReturn) => (
          <TableRow key={taxReturn.id}>
            <TableCell>
              <Link href={`/returns/${taxReturn.id}`} className="inline-flex items-center gap-2 hover:underline">
                <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-soft text-indigo">
                  <FileText className="size-3.5" />
                </span>
                <span className="font-mono text-[13px] font-medium">{taxReturn.number}</span>
              </Link>
            </TableCell>
            <TableCell className="font-medium">
              {taxReturn.filer.name}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">{taxReturn.filer.state}</span>
            </TableCell>
            <TableCell className="text-muted-foreground">{filingStatusLabel(taxReturn.filer.filingStatus)}</TableCell>
            <TableCell className="text-muted-foreground">{formatDate(taxReturn.lastActivityOn)}</TableCell>
            <TableCell
              className={cn("text-right font-medium", taxReturn.refundCents < 0 && "text-muted-foreground")}
            >
              {formatRefund(taxReturn.refundCents)}
            </TableCell>
            <TableCell>
              <ReturnStatusBadge status={displayReturnStatus(taxReturn)} />
            </TableCell>
            <TableCell>
              <Link
                href={`/returns/${taxReturn.id}`}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Open ${taxReturn.number}`}
              >
                <MoreHorizontal className="size-4" />
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
