// Example map. Replace with your design-system map. Old CSS variable -> new token.
export const TOKEN_MAP: Readonly<Record<string, string>> = {
  "--brand-blue": "--color-action-primary",
  "--brand-gray-100": "--color-surface-subtle",
  "--space-sm": "--spacing-200",
};

export type LegacyHit = {
  line: number;
  legacy: string;
  replacement: string;
};

// Deterministic: same input, same output. No model in this step.
export function findLegacyTokens(css: string): LegacyHit[] {
  const hits: LegacyHit[] = [];
  css.split("\n").forEach((text, index) => {
    for (const [legacy, replacement] of Object.entries(TOKEN_MAP)) {
      if (text.includes(`var(${legacy})`)) {
        hits.push({ line: index + 1, legacy, replacement });
      }
    }
  });
  return hits;
}
