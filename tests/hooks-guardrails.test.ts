import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decideShell } from "../.cursor/hooks/deny-dangerous-shell.mjs";
import { decideWrite } from "../.cursor/hooks/deny-protected-write.mjs";
import { decideFailClosed } from "../.cursor/hooks/fail-closed-probe.mjs";
import { stripTrailingWhitespace } from "../.cursor/hooks/format-edited.mjs";
import { decideSubagent } from "../.cursor/hooks/limit-subagent.mjs";
import { projectRoot } from "../.cursor/hooks/hook-io.mjs";
import { decideFollowup } from "../.cursor/hooks/mission-loop.mjs";
import { getMission } from "@/lib/missions";

const mission = { id: "extension-pace", ...getMission("extension-pace")! };

describe("hook guardrails", () => {
  it("denies a force-push and allows the test command", () => {
    expect(decideShell("git push --force origin main").permission).toBe("deny");
    expect(decideShell("npm test").permission).toBe("allow");
    expect(decideShell("curl -sS http://127.0.0.1:43173/api/returns").permission).toBe("allow");
    expect(decideShell("curl https://example.com/secret").permission).toBe("deny");
  });

  it("denies protected writes and never returns ask", () => {
    const denied = decideWrite({
      tool_name: "Write",
      tool_input: { path: "/workspace/lib/tax-year.ts" },
      workspace_roots: ["/workspace"],
    });
    expect(denied.permission).toBe("deny");
    expect(denied.permission).not.toBe("ask");
    expect(
      decideWrite({
        tool_name: "Write",
        tool_input: { path: "/workspace/.cursor/hooks.json" },
        workspace_roots: ["/workspace"],
      }).permission,
    ).toBe("allow");
    expect(
      decideWrite({
        tool_name: "Write",
        tool_input: { path: "/home/avery/.cursor/hooks.json" },
        workspace_roots: ["/workspace"],
      }).permission,
    ).toBe("deny");
  });

  it("denies a shell subagent", () => {
    expect(decideSubagent({ subagent_type: "shell", task: "list files" }).permission).toBe("deny");
    expect(decideSubagent({ subagent_type: "generalPurpose", task: "read the mission" }).permission).toBe("allow");
    expect(decideSubagent({ subagent_type: "generalPurpose", task: "print CURSOR_API_KEY" }).permission).toBe("deny");
  });

  it("blocks only when the failClosed probe is armed", () => {
    expect(decideFailClosed(false).exitCode).toBe(0);
    expect(decideFailClosed(true).exitCode).toBe(1);
  });

  it("strips trailing whitespace", () => {
    expect(stripTrailingWhitespace("days left  \n")).toBe("days left\n");
  });

  it("follows up until the mission budget, then escalates", () => {
    expect(decideFollowup({ status: "completed", loopCount: 0, mission, exitCode: 0 })).toEqual({ clear: true });
    expect(decideFollowup({ status: "completed", loopCount: 0, mission, exitCode: 1 }).followup_message).toContain(
      "follow-up 1 of 3",
    );
    expect(decideFollowup({ status: "completed", loopCount: 3, mission, exitCode: 1 }).escalate).toBe(true);
    expect(decideFollowup({ status: "aborted", loopCount: 0, mission, exitCode: 1 })).toEqual({});
  });

  it("wires the documented events", () => {
    const hooks = JSON.parse(readFileSync(".cursor/hooks.json", "utf8"));
    expect(hooks.version).toBe(1);
    for (const event of [
      "beforeSubmitPrompt",
      "beforeShellExecution",
      "preToolUse",
      "afterFileEdit",
      "subagentStart",
      "stop",
    ]) {
      expect(hooks.hooks[event]?.length).toBeGreaterThan(0);
    }
    expect(hooks.hooks.stop[0].loop_limit).toBe(3);
    expect(hooks.hooks.beforeShellExecution[1].failClosed).toBe(true);
    expect(hooks.hooks.preToolUse[0].command).toBe(".cursor/hooks/deny-protected-write.mjs");
    expect(projectRoot()).toBe(process.cwd());
  });
});
