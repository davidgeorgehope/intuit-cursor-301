import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ReturnStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getRejectedReturns } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { extensionDaysLeft } from "@/lib/extension-pace";
import { rejectDetail } from "@/lib/rejects";

export const metadata = {
  title: "E-file rejects",
};

export const dynamic = "force-dynamic";

export default async function RejectsPage() {
  const rejected = await getRejectedReturns();
  const daysLeft = extensionDaysLeft();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="E-file"
        title="Rejected returns"
        description="IRS acknowledgments that came back rejected. Each one needs a fix and a resubmit before the Oct 15 extension deadline."
      />

      {rejected.length === 0 ? (
        <EmptyState
          title="No rejected returns"
          body="Every transmitted return was accepted or is still waiting on an acknowledgment."
          imageSrc="/images/empty-returns.svg"
          imageAlt="Empty return folder illustration"
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/returns">All returns</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {rejected.map((taxReturn) => {
            const detail = taxReturn.rejectCode ? rejectDetail(taxReturn.rejectCode) : null;
            return (
              <Link key={taxReturn.id} href={`/returns/${taxReturn.id}`}>
                <Card className="transition-colors hover:bg-accent/40">
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">{taxReturn.filer.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {taxReturn.number} · {taxReturn.rejectCode} ·{" "}
                        {taxReturn.rejectedOn ? `rejected ${formatDate(taxReturn.rejectedOn)}` : "rejected"}
                      </p>
                      {detail ? (
                        <>
                          <p className="text-sm">{detail.summary}</p>
                          <p className="text-sm text-muted-foreground">{detail.fix}</p>
                        </>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        {daysLeft} {daysLeft === 1 ? "day" : "days"} left
                      </p>
                      <ReturnStatusBadge status="REJECTED" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
