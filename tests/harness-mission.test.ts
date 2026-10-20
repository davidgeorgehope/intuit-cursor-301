import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildDryRunStream, compareChecks } from "@/lib/harness-report";
import { getMission } from "@/lib/missions";

describe("mission harness", () => {
  it("reports a dry run at zero dollars", () => {
    const spec = getMission("extension-pace");
    expect(spec).toBeDefined();
    const events = buildDryRunStream({
      mission: { id: "extension-pace", ...spec! },
      exitCode: 0,
      summary: "7 days",
    });
    expect(events[0]?.type).toBe("system");
    expect(events.at(-1)?.costUsd).toBe(0);
    expect(events.at(-1)?.usage?.totalTokens).toBe(0);
  });

  it("shows the weak check and the unit test as separate rungs", () => {
    const text = compareChecks({ weakExit: 0, strongExit: 1 });
    expect(text).toContain("before");
    expect(text).toContain("PASS");
    expect(text).toContain("FAIL");
    expect(text).toContain("costUsd: 0");
  });

  it("keeps the mission spec and the registry on the same command", () => {
    const spec = getMission("extension-pace")!;
    const markdown = readFileSync("missions/extension-pace/MISSION.md", "utf8");
    expect(markdown).toContain(spec.doneWhen);
    expect(spec.budget.maxFollowups).toBe(3);
    expect(getMission("verify-console")?.doneWhen).toBe("npm run verify");
  });
});
