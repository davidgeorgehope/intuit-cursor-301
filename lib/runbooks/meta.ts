/**
 * Cursor runbooks as they appear on /runbooks and in the README.
 * The 301 track is shipped. The 401 track is the follow-on workshop.
 */

export * from "@/lib/runbooks/types";
export { RUNBOOK_SECTIONS_301 } from "@/lib/runbooks/beats/301";
export { RUNBOOK_SECTIONS_401 } from "@/lib/runbooks/beats/401";
export { PROJECT_AGENTS, PROJECT_SKILLS } from "@/lib/runbooks/agents";
export { RUNBOOK_TRACKS, getRunbookTrack, type RunbookTrack } from "@/lib/runbooks/tracks";
export {
  runbookBeatSequence,
  runbookBeats,
  runbookSectionHref,
  runbookTrackHref,
} from "@/lib/runbooks/catalog";
