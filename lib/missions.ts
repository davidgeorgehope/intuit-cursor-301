import registry from "@/missions/registry.json";

export type MissionBudget = {
  maxFollowups: number;
  note: string;
};

export type MissionSpec = {
  title: string;
  outcome: string;
  doneWhen: string;
  doneWhenArgs: readonly string[];
  stop: string;
  escalation: string;
  budget: MissionBudget;
};

export type MissionId = keyof typeof registry;

export const MISSIONS = registry as Record<MissionId, MissionSpec>;

export function isMissionId(value: string): value is MissionId {
  return Object.hasOwn(MISSIONS, value);
}

export function getMission(id: string): MissionSpec | undefined {
  return isMissionId(id) ? MISSIONS[id] : undefined;
}
