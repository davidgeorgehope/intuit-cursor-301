// Shared helpers for the local-runtime SDK scripts.
// Intuit rule: local runtime only. These scripts never pass `cloud`.
import type { SDKAgent, SDKMessage, TokenUsage } from "@cursor/sdk";

export const DEFAULT_MODEL = process.env.HARNESS_MODEL ?? "composer-2.5";

export function requireKey(): string {
  const key = process.env.CURSOR_API_KEY;
  if (!key) {
    console.error(
      "CURSOR_API_KEY is not set. Create a user key in the Cursor dashboard (API Keys) and export it, or use the offline dry-run: npm run harness:mission",
    );
    process.exit(2);
  }
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 13)) {
    console.error(`@cursor/sdk needs Node 22.13 or later. This is Node ${process.versions.node}.`);
    process.exit(2);
  }
  return key;
}

export function argValue(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

/** One line per tool call and per turn, in the spirit of `agent -p --output-format stream-json`. Assistant text arrives in chunks, so read it from run.wait().result instead. */
export function logEvent(event: SDKMessage): void {
  if (event.type === "tool_call") {
    if (event.status !== "running") console.log(JSON.stringify({ type: "tool_call", name: event.name, status: event.status }));
    return;
  }
  if (event.type === "usage") {
    console.log(JSON.stringify({ type: "usage", totalTokens: event.usage.totalTokens }));
  }
}

export function formatTokens(u?: TokenUsage): string {
  if (!u) return "no token usage reported";
  return `tokens total=${u.totalTokens} in=${u.inputTokens} out=${u.outputTokens} cacheRead=${u.cacheReadTokens} cacheWrite=${u.cacheWriteTokens}`;
}

/**
 * Billed cost. Local-agent usage is rolled out per account; until then getUsage()
 * throws code "feature_unavailable". Cost can also take a moment to settle.
 */
export async function reportCost(agent: SDKAgent): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const u = await agent.getUsage();
      if (u.cost) return `cost charged=$${(u.cost.chargedCents / 100).toFixed(4)} raw=$${(u.cost.rawCostCents / 100).toFixed(4)}`;
    } catch (err) {
      const code = (err as { code?: string }).code ?? (err as Error).message;
      return `cost unavailable (getUsage: ${code}). Read dollars in the usage dashboard under the SDK tag.`;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return "cost not settled yet (getUsage returned no cost). Check the usage dashboard under the SDK tag.";
}
