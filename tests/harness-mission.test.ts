import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildDryRunStream, compareChecks } from "@/lib/harness-report";
import { getMission } from "@/lib/missions";
import { compactStream, summarizeStream } from "@/lib/harness-stream";

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

  it("summarizes a real CLI stream: tool calls, test runs, and summed tokens", () => {
    const lines = [
      '{"type":"system","subtype":"init","model":"Composer 2.5"}',
      '{"type":"thinking","subtype":"delta","text":"I"}',
      '{"type":"tool_call","subtype":"started","tool_call":{"readToolCall":{"args":{"path":"lib/extension-pace.ts"}}}}',
      '{"type":"tool_call","subtype":"started","tool_call":{"editToolCall":{"args":{"path":"lib/extension-pace.ts"}}}}',
      '{"type":"tool_call","subtype":"started","tool_call":{"shellToolCall":{"args":{"command":"npm test -- tests/extension-pace.test.ts"}}}}',
      '{"type":"result","duration_ms":1000,"is_error":false,"result":"done","usage":{"inputTokens":10,"outputTokens":2,"cacheReadTokens":5,"cacheWriteTokens":0}}',
      '{"type":"result","duration_ms":500,"is_error":false,"result":"done again","usage":{"inputTokens":1,"outputTokens":1,"cacheReadTokens":1,"cacheWriteTokens":0}}',
    ];
    const s = summarizeStream(lines);
    expect(s.toolCalls).toBe(3);
    expect(s.ranTests).toBe(true);
    expect(s.editedFiles).toEqual(["lib/extension-pace.ts"]);
    expect(s.totalTokens).toBe(20);
    expect(s.durationMs).toBe(1500);
    expect(s.result).toBe("done again");
    expect(compactStream(lines)).toHaveLength(6);
  });

  it("does not count a typecheck as a test run", () => {
    const s = summarizeStream([
      '{"type":"tool_call","subtype":"started","tool_call":{"shellToolCall":{"args":{"command":"npm run typecheck"}}}}',
    ]);
    expect(s.ranTests).toBe(false);
    expect(s.shellCommands).toEqual(["npm run typecheck"]);
  });
});
