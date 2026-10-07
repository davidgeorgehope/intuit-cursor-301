import { notFound } from "next/navigation";
import { HashScroll } from "@/components/hash-scroll";
import { PageHeader } from "@/components/page-header";
import { RunbookCatalog } from "@/components/runbook-catalog";
import { RunbookCatalogSelect } from "@/components/runbook-catalog-select";
import { RUNBOOK_TRACKS, getRunbookTrack } from "@/lib/runbooks/meta";

export function generateStaticParams() {
  return RUNBOOK_TRACKS.map((track) => ({ track: track.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params;
  const selectedTrack = getRunbookTrack(track);
  return { title: selectedTrack ? `Runbooks · ${selectedTrack.title}` : "Runbooks" };
}

export default async function RunbookTrackPage({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track: trackId } = await params;
  const track = getRunbookTrack(trackId);
  if (!track) notFound();

  return (
    <div className="space-y-6">
      <HashScroll />
      <PageHeader
        eyebrow="Demo catalog"
        title="Runbooks"
        description="Jump to a section and copy the next beat into Cursor."
      />

      <RunbookCatalogSelect
        tracks={RUNBOOK_TRACKS.map((entry) => ({ id: entry.id, title: entry.title }))}
        trackId={track.id}
      />

      <div>
        <h2 className="text-xl font-semibold tracking-tight">{track.title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {track.description}
        </p>
      </div>

      <RunbookCatalog trackId={track.id} sections={track.sections} />
    </div>
  );
}
