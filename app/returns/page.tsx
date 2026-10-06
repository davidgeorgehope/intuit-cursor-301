import { EmptyState } from "@/components/empty-state";
import { FilterPills } from "@/components/filter-pills";
import { PageHeader } from "@/components/page-header";
import { ReturnTable } from "@/components/return-table";
import { SearchField } from "@/components/search-field";
import { Card, CardContent } from "@/components/ui/card";
import { getReturns } from "@/lib/data";

export const metadata = {
  title: "Returns",
};

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "EXTENDED", label: "Extended" },
  { id: "READY", label: "Ready to file" },
  { id: "TRANSMITTED", label: "Transmitted" },
  { id: "ACCEPTED", label: "Accepted" },
  { id: "REJECTED", label: "Rejected" },
];

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "ALL";
  const q = params.q ?? "";
  const returns = await getReturns({ status, q });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Tax year 2025"
        title="Returns"
        description="Every Form 1040 in this workspace. Filers are synthetic, and SSNs show the last four digits only."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterPills pathname="/returns" value={status} extra={{ q }} items={FILTERS} />
        <SearchField defaultValue={q} status={status} placeholder="Search filer, state, or TY25-…" />
      </div>

      {returns.length === 0 ? (
        <EmptyState
          title="No returns in this slice"
          body="Clear the filter or search. The seed still has Jordan Hale, Remy & Ana Sato, Ellis Marlow, and the rest of the book."
          imageSrc="/images/empty-returns.svg"
          imageAlt="Empty return folder illustration"
        />
      ) : (
        <Card className="overflow-hidden py-0">
          <CardContent className="px-0 py-2">
            <ReturnTable returns={returns} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
