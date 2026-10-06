export type DemoTrack = "301";

export type BeatPromptType = "reusable" | "adaptable" | "none";

export type DemoBeat = {
  id: string;
  title: string;
  detail: string;
  promptType?: BeatPromptType;
  example?: string;
  pasteLabel?: string;
};

export type DemoSection = {
  id: string;
  title: string;
  beats: readonly DemoBeat[];
};
