// Summarize a real `agent -p --output-format stream-json` transcript.
// Pure functions, so the unit tests can feed them recorded lines.

export type StreamSummary = {
  toolCalls: number;
  toolKinds: Record<string, number>;
  shellCommands: string[];
  ranTests: boolean;
  editedFiles: string[];
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalTokens: number;
  durationMs: number;
  isError: boolean;
  result: string;
};

const TEST_COMMAND = /\b(vitest|npm (run )?test|npx vitest|node --test|jest)\b/;

function toolKind(toolCall: Record<string, unknown>): string {
  const key = Object.keys(toolCall).find((k) => k.endsWith("ToolCall"));
  return key ? key.replace(/ToolCall$/, "") : "unknown";
}

function stringField(value: unknown, keys: string[]): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  for (const key of keys) {
    const v = (value as Record<string, unknown>)[key];
    if (typeof v === "string") return v;
  }
  return undefined;
}

export function summarizeStream(lines: string[]): StreamSummary {
  const summary: StreamSummary = {
    toolCalls: 0,
    toolKinds: {},
    shellCommands: [],
    ranTests: false,
    editedFiles: [],
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    totalTokens: 0,
    durationMs: 0,
    isError: false,
    result: "",
  };
  const edited = new Set<string>();
  for (const line of lines) {
    if (!line.trim()) continue;
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    if (event.type === "tool_call" && event.subtype === "started") {
      const toolCall = (event.tool_call ?? {}) as Record<string, unknown>;
      const kind = toolKind(toolCall);
      summary.toolCalls++;
      summary.toolKinds[kind] = (summary.toolKinds[kind] ?? 0) + 1;
      const args = (toolCall[`${kind}ToolCall`] as { args?: unknown } | undefined)?.args;
      if (kind === "shell") {
        const command = stringField(args, ["command", "cmd"]) ?? "";
        summary.shellCommands.push(command);
        if (TEST_COMMAND.test(command)) summary.ranTests = true;
      }
      if (["edit", "write", "delete", "strReplace", "applyAgentDiff"].includes(kind)) {
        const path = stringField(args, ["path", "filePath", "file_path"]);
        if (path) edited.add(path);
      }
    }
    if (event.type === "result") {
      const usage = (event.usage ?? {}) as Record<string, number>;
      // A stop-hook follow-up can produce more than one result event. Sum them.
      summary.inputTokens += usage.inputTokens ?? 0;
      summary.outputTokens += usage.outputTokens ?? 0;
      summary.cacheReadTokens += usage.cacheReadTokens ?? 0;
      summary.cacheWriteTokens += usage.cacheWriteTokens ?? 0;
      summary.durationMs += typeof event.duration_ms === "number" ? event.duration_ms : 0;
      summary.isError = summary.isError || event.is_error === true;
      if (typeof event.result === "string") summary.result = event.result;
    }
  }
  summary.totalTokens = summary.inputTokens + summary.outputTokens + summary.cacheReadTokens + summary.cacheWriteTokens;
  summary.editedFiles = [...edited];
  return summary;
}

/** Drop per-token thinking and text deltas so a saved transcript stays readable. */
export function compactStream(lines: string[]): string[] {
  return lines.filter((line) => {
    if (!line.trim()) return false;
    try {
      const event = JSON.parse(line) as { type?: string; subtype?: string };
      if (event.type === "thinking") return false;
      return true;
    } catch {
      return true;
    }
  });
}
