// Offline tests for lib/agent-cli.mjs and the stream summary, against a recorded unified stream
// (Grok Build CLI 1.0.67 [unified], composer-2.5, Oct 22 2026). No model call. Run: npm run agent-cli:test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildAgentArgs, flavorOf, normalizeStreamLines } from "../lib/agent-cli.mjs";

const unified = readFileSync(new URL("../tests/fixtures/unified-stream.jsonl", import.meta.url), "utf8").split("\n");

test("flavor detection from --version", () => {
  assert.equal(flavorOf("grok 1.0.67 (2fe064390d07) [unified]"), "unified");
  assert.equal(flavorOf("2026.10.12-d47ca18"), "cursor");
});

test("unified args: prompt follows -p, streaming-json, always-approve or plan", () => {
  const cli = { bin: "agent", flavor: "unified", version: "grok 1.0.67 [unified]" };
  assert.deepEqual(buildAgentArgs(cli, { prompt: "fix it", model: "composer-2.5" }), ["-p", "fix it", "--output-format", "streaming-json", "-m", "composer-2.5", "--always-approve"]);
  assert.deepEqual(buildAgentArgs(cli, { prompt: "q", model: "m", format: "text", readOnly: true }), ["-p", "q", "--output-format", "plain", "-m", "m", "--permission-mode", "plan"]);
});

test("cursor args keep the old form", () => {
  const cli = { bin: "cursor-agent", flavor: "cursor", version: "2026.10.12" };
  assert.deepEqual(buildAgentArgs(cli, { prompt: "fix it", model: "composer-2.5" }), ["--print", "--output-format", "stream-json", "--trust", "--model", "composer-2.5", "--force", "fix it"]);
});

test("unified stream normalizes to old shapes: tool calls, shell exit, tokens, final text", () => {
  const events = normalizeStreamLines(unified);
  const started = events.filter((e) => e.type === "tool_call" && e.subtype === "started");
  assert.equal(started.length, 3);
  assert.deepEqual(started.map((e) => Object.keys(e.tool_call)[0]), ["shellToolCall", "readToolCall", "editToolCall"]);
  assert.equal(started[0].tool_call.shellToolCall.args.command, "cat a.txt && npm --version");
  const shellDone = events.find((e) => e.type === "tool_call" && e.subtype === "completed" && e.tool_call.shellToolCall);
  assert.deepEqual(shellDone.tool_call.shellToolCall.result, { success: { exitCode: 0, stdout: "hi\n11.6.1\n" } });
  const result = events.find((e) => e.type === "result");
  assert.equal(result.result, "done");
  assert.equal(result.is_error, false);
  assert.equal(result.usage.totalTokens, 78688);
});

test("summarizeStream gives the same report fields for a unified stream", async () => {
  const { summarizeStream } = await import("../lib/harness-stream.ts");
  const s = summarizeStream(unified);
  assert.equal(s.toolCalls, 3);
  assert.deepEqual(s.toolKinds, { shell: 1, read: 1, edit: 1 });
  assert.deepEqual(s.shellCommands, ["cat a.txt && npm --version"]);
  assert.equal(s.ranTests, false);
  assert.deepEqual(s.editedFiles, ["/private/tmp/grok-probe/a.txt"]);
  assert.equal(s.totalTokens, 78688);
  assert.equal(s.result, "done");
  const withTest = summarizeStream([
    '{"type":"tool_call","toolCallId":"t1","kind":"execute","status":"in_progress","toolName":"run_terminal_command","rawInput":{"command":"npm test -- tests/extension-pace.test.ts"}}',
    '{"type":"end","stopReason":"end_turn","usage":{"input_tokens":1,"output_tokens":1,"total_tokens":2}}',
  ]);
  assert.equal(withTest.ranTests, true);
  assert.equal(withTest.totalTokens, 2);
});
