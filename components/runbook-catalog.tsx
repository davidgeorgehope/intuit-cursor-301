import { CopyButton } from "@/components/copy-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { runbookSectionHref, type DemoSection } from "@/lib/runbooks/meta";

function PasteBlock({ text, label = "Paste in Cursor" }: { text: string; label?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <CopyButton text={text} label="Copy" />
      </div>
      <pre className="overflow-auto rounded-lg border border-border bg-muted/60 p-3 text-xs leading-relaxed whitespace-pre-wrap">
        {text}
      </pre>
    </div>
  );
}

function SectionPanel({ section }: { section: DemoSection }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold tracking-tight">{section.title}</h3>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {section.beats.map((beat) => (
          <Card key={beat.id} className="flex flex-col">
            <CardContent className="flex flex-1 flex-col gap-3">
              <div className="space-y-1.5">
                <p className="font-medium">{beat.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{beat.detail}</p>
              </div>
              {beat.example ? (
                <div className="mt-auto">
                  <PasteBlock text={beat.example} label={beat.pasteLabel} />
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function RunbookCatalog({
  trackId,
  sections,
}: {
  trackId: string;
  sections: readonly DemoSection[];
}) {
  return (
    <div className="space-y-4">
      <nav aria-label={`${trackId} sections`} className="flex gap-2 overflow-x-auto pb-1">
        {sections.map((section) => (
          <Button key={section.id} asChild size="sm" variant="outline" className="shrink-0">
            <a href={runbookSectionHref(trackId, section.id)}>{section.title}</a>
          </Button>
        ))}
      </nav>

      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-20">
            <SectionPanel section={section} />
          </section>
        ))}
      </div>
    </div>
  );
}
