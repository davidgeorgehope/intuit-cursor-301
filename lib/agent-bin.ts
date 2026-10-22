import { spawnSync } from "node:child_process";

// Pick the Cursor CLI. On some machines another tool owns the name "agent".
export function agentBin(): string {
  if (process.env.CURSOR_AGENT_BIN) return process.env.CURSOR_AGENT_BIN;
  const probe = spawnSync("cursor-agent", ["--version"], { encoding: "utf8" });
  return probe.status === 0 ? "cursor-agent" : "agent";
}
