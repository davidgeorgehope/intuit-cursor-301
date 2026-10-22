// One place to pick the agent CLI, build its headless arguments, and read its stream.
// Two flavors:
//   unified: Grok Build CLI as `agent` (`agent --version` prints "grok ... [unified]").
//            agent -p "<prompt>" --output-format streaming-json -m <model> --always-approve
//   cursor:  older Cursor CLI (`cursor-agent`, or `agent` on machines without the unified CLI).
//            cursor-agent --print --output-format stream-json --trust --force --model <model> "<prompt>"
// Override with CURSOR_AGENT_BIN=<path or name>. The flavor is still read from its --version
// (or forced with CURSOR_AGENT_FLAVOR=unified|cursor).
// The normalizer turns unified events into the older event shapes, so every counter and grader
// in this repo reads one format.
import { spawnSync } from "node:child_process";

/** @typedef {"unified" | "cursor"} Flavor */
/** @typedef {{ bin: string, flavor: Flavor, version: string }} AgentCli */

function probe(bin) {
  const r = spawnSync(bin, ["--version"], { encoding: "utf8", timeout: 60_000 });
  if (r.error || r.status !== 0) return null;
  return `${r.stdout ?? ""}`.trim() || `${r.stderr ?? ""}`.trim();
}

/** @param {string} version @returns {Flavor} */
export function flavorOf(version) {
  return /grok|unified/i.test(version) ? "unified" : "cursor";
}

/** @returns {AgentCli | null} */
export function detectAgentCli(env = process.env) {
  const forced = env.CURSOR_AGENT_FLAVOR === "unified" || env.CURSOR_AGENT_FLAVOR === "cursor" ? env.CURSOR_AGENT_FLAVOR : null;
  if (env.CURSOR_AGENT_BIN) {
    const version = probe(env.CURSOR_AGENT_BIN);
    if (version === null) return null;
    return { bin: env.CURSOR_AGENT_BIN, flavor: forced ?? flavorOf(version), version };
  }
  const agentVersion = probe("agent");
  if (agentVersion !== null && flavorOf(agentVersion) === "unified") return { bin: "agent", flavor: forced ?? "unified", version: agentVersion };
  const cursorVersion = probe("cursor-agent");
  if (cursorVersion !== null) return { bin: "cursor-agent", flavor: forced ?? "cursor", version: cursorVersion };
  if (agentVersion !== null) return { bin: "agent", flavor: forced ?? "cursor", version: agentVersion };
  return null;
}

/**
 * Headless arguments for one prompt.
 * @param {AgentCli} cli
 * @param {{ prompt: string, model: string, format?: "stream" | "text", readOnly?: boolean }} opts
 */
export function buildAgentArgs(cli, { prompt, model, format = "stream", readOnly = false }) {
  if (cli.flavor === "unified") {
    // -p takes the prompt as its value, so the prompt must follow -p directly.
    const args = ["-p", prompt, "--output-format", format === "stream" ? "streaming-json" : "plain", "-m", model];
    if (readOnly) args.push("--permission-mode", "plan");
    else args.push("--always-approve");
    return args;
  }
  const args = ["--print", "--output-format", format === "stream" ? "stream-json" : "text", "--trust", "--model", model];
  if (readOnly) args.push("--mode", "ask", "--force");
  else args.push("--force");
  args.push(prompt);
  return args;
}

/** Human-readable command line, for logs and notes. */
export function describeAgentCommand(cli, opts) {
  return [cli.bin, ...buildAgentArgs(cli, { ...opts, prompt: "<prompt>" }).map((a) => (/\s/.test(a) ? JSON.stringify(a) : a))].join(" ");
}

const KIND_BY_ACP = { execute: "shell", read: "read", edit: "edit", delete: "delete", search: "grep", fetch: "webFetch" };
const KIND_BY_TOOL = {
  run_terminal_command: "shell",
  read_file: "read",
  search_replace: "edit",
  write: "write",
  list_dir: "ls",
  grep: "grep",
  glob: "glob",
  Delete: "delete",
  spawn_subagent: "task",
  web_search: "webSearch",
  web_fetch: "webFetch",
};

function unifiedKind(event) {
  return KIND_BY_TOOL[event.toolName] ?? KIND_BY_ACP[event.kind] ?? (typeof event.kind === "string" ? event.kind : "unknown");
}

/**
 * Stateful: remembers each tool call's kind and args until its update arrives, and the text since the
 * last tool call (unified text events are deltas). Old-format events pass through unchanged.
 */
export function createStreamNormalizer() {
  const calls = new Map();
  let text = "";
  /** @param {Record<string, any>} event @returns {Record<string, any>[]} */
  return function normalize(event) {
    if (!event || typeof event !== "object") return [];
    switch (event.type) {
      case "available_commands":
        return [{ type: "system", subtype: "init", tools: event.tools ?? [] }];
      case "thought":
        return [{ type: "thinking", subtype: "delta", text: event.data ?? "" }];
      case "text":
        text += typeof event.data === "string" ? event.data : "";
        return [{ type: "assistant", message: { role: "assistant", content: [{ type: "text", text: event.data ?? "" }] } }];
      case "usage":
        return [];
      case "tool_call": {
        if (event.subtype || !event.toolCallId) return [event];
        const kind = unifiedKind(event);
        const raw = event.rawInput && typeof event.rawInput === "object" ? event.rawInput : {};
        const path = raw.path ?? raw.file_path ?? raw.target_file ?? event.locations?.[0]?.path;
        const args = { ...raw, ...(path ? { path } : {}) };
        calls.set(event.toolCallId, { kind, args });
        text = "";
        return [{ type: "tool_call", subtype: "started", call_id: event.toolCallId, tool_call: { [`${kind}ToolCall`]: { args } } }];
      }
      case "tool_call_update": {
        const call = calls.get(event.toolCallId) ?? { kind: "unknown", args: {} };
        if (event.status !== "completed" && event.status !== "failed") return [];
        const out = event.rawOutput && typeof event.rawOutput === "object" ? event.rawOutput : {};
        let result;
        if (event.status === "failed") {
          result = { rejected: { reason: JSON.stringify(event.content ?? out).slice(0, 500) } };
        } else if (call.kind === "shell") {
          const exitCode = typeof out.exit_code === "number" ? out.exit_code : null;
          const stdout = typeof out.output_for_prompt === "string" ? out.output_for_prompt : "";
          result = exitCode === 0 ? { success: { exitCode, stdout } } : { failure: { exitCode, stdout } };
        } else {
          result = { success: {} };
        }
        return [{ type: "tool_call", subtype: "completed", call_id: event.toolCallId, tool_call: { [`${call.kind}ToolCall`]: { args: call.args, result } } }];
      }
      case "end": {
        const u = event.usage ?? {};
        const finalText = text;
        text = "";
        return [{
          type: "result",
          subtype: event.stopReason === "end_turn" ? "success" : String(event.stopReason ?? "unknown"),
          is_error: event.stopReason !== "end_turn",
          result: finalText,
          session_id: event.sessionId,
          request_id: event.requestId,
          duration_ms: typeof event.duration_ms === "number" ? event.duration_ms : undefined,
          usage: {
            inputTokens: u.input_tokens ?? 0,
            outputTokens: u.output_tokens ?? 0,
            cacheReadTokens: u.cache_read_input_tokens ?? 0,
            cacheWriteTokens: u.cache_creation_input_tokens ?? 0,
            totalTokens: u.total_tokens,
          },
        }];
      }
      default:
        return [event];
    }
  };
}

/** Parse raw stdout lines from either flavor into old-format event objects. */
export function normalizeStreamLines(lines) {
  const normalize = createStreamNormalizer();
  const events = [];
  for (const line of lines) {
    if (!line || !line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    events.push(...normalize(event));
  }
  return events;
}
