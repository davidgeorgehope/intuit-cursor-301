import { RUNBOOK_SECTIONS_301 } from "@/lib/runbooks/beats/301";
import { RUNBOOK_SECTIONS_401 } from "@/lib/runbooks/beats/401";
import type { DemoSection, DemoTrack } from "@/lib/runbooks/types";

export const RUNBOOK_TRACKS = [
  {
    id: "301" as const,
    title: "301",
    description:
      "You will engineer the context an agent sees, decompose one feature into scoped sessions, orchestrate the parts that split behind a single approval gate, and match each role to a model on purpose.",
    sections: RUNBOOK_SECTIONS_301,
  },
  {
    id: "401" as const,
    title: "401",
    description:
      "You set the mission, the guardrails, and the budget. The agent runs the loop. You keep the architecture, the governance, and the risk.",
    sections: RUNBOOK_SECTIONS_401,
  },
] as const satisfies readonly {
  id: DemoTrack;
  title: string;
  description: string;
  sections: readonly DemoSection[];
}[];

export type RunbookTrack = (typeof RUNBOOK_TRACKS)[number];

export function getRunbookTrack(track: string): RunbookTrack | undefined {
  return RUNBOOK_TRACKS.find((entry) => entry.id === track);
}
