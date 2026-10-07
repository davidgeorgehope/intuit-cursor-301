import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_AS_OF } from "@/lib/clock";
import { getWorkspace } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { DEMO_OPERATOR } from "@/lib/demo-session";
import { formatUsd } from "@/lib/money";
import {
  EDUCATION_CREDITS,
  EDUCATION_CREDIT_LABEL,
  EDUCATION_CREDIT_MAX_CENTS,
  EDUCATION_CREDIT_SCOPE,
  EXTENSION_DEADLINE,
  FILING_DEADLINE,
  TAX_YEAR,
} from "@/lib/tax-year";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const workspace = await getWorkspace();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="A demo console. The filers are invented, and the tax-year figures come from one file."
      />

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>Signed-in shell only — there is no auth provider behind this screen.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Name</Label>
            <Input id="workspace-name" defaultValue={workspace.name} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="operator">Operator</Label>
            <Input id="operator" defaultValue={`${DEMO_OPERATOR.name} · ${DEMO_OPERATOR.role}`} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax-year">Tax year</Label>
            <Input id="tax-year" defaultValue={String(TAX_YEAR)} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-clock">Demo clock</Label>
            <Input id="demo-clock" defaultValue={`${formatDate(DEMO_AS_OF)} · frozen`} readOnly />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax year {TAX_YEAR} limits</CardTitle>
          <CardDescription>Read from lib/tax-year.ts. Nothing in the app types a limit inline.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {EDUCATION_CREDITS.map((credit) => (
            <div key={credit} className="rounded-md border border-border bg-background/70 px-3 py-3">
              <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">{EDUCATION_CREDIT_LABEL[credit]}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{formatUsd(EDUCATION_CREDIT_MAX_CENTS[credit])}</p>
              <p className="mt-1 text-xs text-muted-foreground">Maximum {EDUCATION_CREDIT_SCOPE[credit]}</p>
            </div>
          ))}
          <div className="rounded-md border border-border bg-background/70 px-3 py-3">
            <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Filing deadline</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{formatDate(FILING_DEADLINE)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Form 1040 without an extension</p>
          </div>
          <div className="rounded-md border border-border bg-background/70 px-3 py-3">
            <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Extension deadline</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{formatDate(EXTENSION_DEADLINE)}</p>
            <p className="mt-1 text-xs text-muted-foreground">With Form 4868 on file</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taxpayer data</CardTitle>
          <CardDescription>What this database is allowed to hold.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>Every filer is synthetic. Emails end in .example.</p>
          <p>
            Only the last four digits of an SSN are stored. Test fixtures use SSNs that start with 000, and a project
            hook blocks prompts that contain any other SSN-shaped number.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
