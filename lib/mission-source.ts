/** Exact return line the loop mission plants and restores. Keep these two strings distinct. */
export const HEALTHY_RETURN = "return daysBetween(EXTENSION_DEADLINE, asOf);";
export const PLANTED_RETURN = "return daysBetween(EXTENSION_DEADLINE, asOf) - 1;";

export function plantExtensionPace(source: string): string {
  if (source.includes(PLANTED_RETURN)) return source;
  if (!source.includes(HEALTHY_RETURN)) {
    throw new Error("lib/extension-pace.ts is not in the known healthy shape, so it was left unchanged.");
  }
  return source.replace(HEALTHY_RETURN, PLANTED_RETURN);
}

export function restoreExtensionPace(source: string): string {
  if (!source.includes(PLANTED_RETURN)) {
    if (source.includes(HEALTHY_RETURN)) return source;
    throw new Error("lib/extension-pace.ts is not in the known planted shape, so it was left unchanged.");
  }
  return source.replace(PLANTED_RETURN, HEALTHY_RETURN);
}
