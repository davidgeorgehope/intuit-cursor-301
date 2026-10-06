/** Frozen demo clock. Age returns against this, never Date.now(). */
export const DEMO_AS_OF = new Date("2026-10-08T12:00:00.000Z");

/** Last 30 days ending on the demo clock — matches the dashboard date chip. */
export const DEMO_WINDOW_START = new Date("2026-09-08T12:00:00.000Z");
export const DEMO_PRIOR_START = new Date("2026-08-09T12:00:00.000Z");
export const DEMO_PRIOR_END = new Date("2026-09-07T12:00:00.000Z");

export function demoDay(isoDate: string) {
  return new Date(`${isoDate}T12:00:00.000Z`);
}
