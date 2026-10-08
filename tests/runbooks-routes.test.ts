import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";
import { GET as getRunbookCatalog } from "@/app/api/runbooks/route";
import { GET as getRunbookTrack } from "@/app/api/runbooks/[track]/route";
import { generateStaticParams as generateTrackParams } from "@/app/runbooks/[track]/page";
import { runbookSectionHref, runbookTrackHref } from "@/lib/runbooks/meta";

const request = new Request("http://localhost/api/runbooks");
const trackParams = (track: string) => ({ params: Promise.resolve({ track }) });

describe("runbooks API", () => {
  it("lists the 301 track with section-header tabs", async () => {
    const response = await getRunbookCatalog();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tracks.map((track: { id: string }) => track.id)).toEqual(["301"]);
    expect(body.tracks[0].href).toBe("/runbooks/301");
    expect(body.tracks[0].sections.map((section: { href: string }) => section.href)).toEqual([
      "/runbooks/301#cultural-shift",
      "/runbooks/301#context-engineering",
      "/runbooks/301#decompose-scope",
      "/runbooks/301#orchestrate",
      "/runbooks/301#cost-engineering",
    ]);
  });

  it("returns the 301 track with beats", async () => {
    const response = await getRunbookTrack(request, trackParams("301"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("301");
    expect(body.sections[0].beats[0].id).toBe("refactor-check");
    expect(body.sections[1].beats[0].id).toBe("open-agents-md");
    expect(body.sections[2].beats.map((beat: { id: string }) => beat.id)).toContain("plan-prompt");
  });

  it.each(["bogus", "101", "201"])("returns 404 for track %s", async (track) => {
    const response = await getRunbookTrack(request, trackParams(track));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Track not found" });
  });
});

describe("runbooks routing", () => {
  it("sends old track and workflow URLs to the 301 track", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];

    expect(redirects).toEqual(
      expect.arrayContaining([
        { source: "/runbooks/101", destination: "/runbooks/301", permanent: false },
        { source: "/runbooks/201", destination: "/runbooks/301", permanent: false },
        { source: "/workflows", destination: "/runbooks/301", permanent: false },
      ]),
    );
  });

  it("builds track and section-header links and prebuilds the 301 page", () => {
    expect(runbookTrackHref("301")).toBe("/runbooks/301");
    expect(runbookSectionHref("301", "orchestrate")).toBe("/runbooks/301#orchestrate");
    expect(generateTrackParams()).toEqual([{ track: "301" }]);
  });
});
