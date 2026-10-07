import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 py-16">
      <p className="text-xs font-medium tracking-[0.16em] text-indigo uppercase">Not on file</p>
      <h1 className="text-3xl font-semibold tracking-tight">That page is not in this workspace.</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Stable demo routes live at Dashboard, Returns, E-file rejects, Credit reviews, Runbooks, and Settings.
        Return IDs look like <span className="font-mono text-foreground">ret_1043</span>; credit reviews like{" "}
        <span className="font-mono text-foreground">rev_1043</span>.
      </p>
      <Button asChild>
        <Link href="/">Back to the dashboard</Link>
      </Button>
    </div>
  );
}
