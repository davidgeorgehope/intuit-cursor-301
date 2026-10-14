import { DEMO_AS_OF } from "@/lib/clock";
import { daysBetween } from "@/lib/dates";
import { EXTENSION_DEADLINE } from "@/lib/tax-year";

/** Days from the frozen demo clock to the Oct 15 extension deadline. */
export function extensionDaysLeft(asOf: Date = DEMO_AS_OF): number {
  return daysBetween(EXTENSION_DEADLINE, asOf);
}
