import Link from "next/link";
import { CalendarClock, CalendarRange, CircleDollarSign, GraduationCap, OctagonAlert } from "lucide-react";
import { RefundChart } from "@/components/charts/refund-chart";
import { ReviewDonut } from "@/components/charts/review-donut";
import { KpiCard } from "@/components/kpi-card";
import { ReturnTable } from "@/components/return-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_AS_OF } from "@/lib/clock";
import { getDashboard } from "@/lib/data";
import { daysBetween } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { EXTENSION_DEADLINE } from "@/lib/tax-year";

export const metadata = {
  title: "Dashboard",
};

// Read the seed at request time so `next start` reflects a reseed.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { returns, series, breakdown, kpis } = await getDashboard();
  const recent = returns.slice(0, 6);
  const daysToExtension = daysBetween(EXTENSION_DEADLINE, DEMO_AS_OF);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            TurboTax Expert Ops · tax year 2025 · {kpis.filerCount} synthetic filers · clock frozen 8 Oct 2026.
          </p>
        </div>
        <p className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium shadow-xs">
          <CalendarRange className="size-4 text-muted-foreground" />
          Sep 8 – Oct 8, 2026
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Refunds Accepted"
          value={formatUsd(kpis.refundsAcceptedCents)}
          hint="vs Aug 9 – Sep 7"
          change={kpis.refundsChange}
          icon={CircleDollarSign}
          tone="success"
        />
        <KpiCard
          label="Extended, Not Filed"
          value={String(kpis.extendedCount)}
          hint={`Due Oct 15 · ${daysToExtension} days left`}
          icon={CalendarClock}
          tone="indigo"
        />
        <KpiCard
          label="E-file Rejects"
          value={String(kpis.rejectedCount)}
          hint="Fix and resubmit before Oct 15"
          icon={OctagonAlert}
          tone="danger"
        />
        <KpiCard
          label="Open Credit Reviews"
          value={String(kpis.openReviewCount)}
          hint={`${kpis.needsReviewCount} need an expert`}
          icon={GraduationCap}
          tone="indigo"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.9fr)]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Refunds accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <RefundChart
              series={series}
              totalCents={kpis.refundsAcceptedCents}
              change={kpis.refundsChange}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Credit reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewDonut slices={breakdown} />
          </CardContent>
        </Card>
      </section>

      <Card className="overflow-hidden py-0">
        <CardHeader className="flex-row items-center justify-between px-5 pt-5">
          <CardTitle>Recent activity</CardTitle>
          <Link href="/returns" className="text-sm font-medium text-indigo hover:underline">
            View all returns →
          </Link>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <ReturnTable returns={recent} />
        </CardContent>
      </Card>
    </div>
  );
}
