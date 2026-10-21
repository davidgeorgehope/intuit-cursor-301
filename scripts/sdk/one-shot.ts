// One prompt, one local SDK run, printed as stream-json-shaped lines so
// lib/harness-stream.ts can summarize it like a CLI transcript.
// Used by harness-ready-vs-bare --runner sdk and harness:mission --sdk.
import { Agent } from "@cursor/sdk";
import { DEFAULT_MODEL, argValue, requireKey } from "./common";

async function main() {
  const apiKey = requireKey();
  const cwd = argValue("--cwd", process.cwd())!;
  const prompt = argValue("--prompt")!;
  const model = argValue("--model", DEFAULT_MODEL)!;
  const agent = await Agent.create({ apiKey, model: { id: model }, local: { cwd, settingSources: ["project"] } });
  try {
    const run = await agent.send(prompt);
    for await (const event of run.stream()) {
      if (event.type === "tool_call" && event.status === "running") {
        const kind = event.name;
        console.log(JSON.stringify({ type: "tool_call", subtype: "started", tool_call: { [`${kind}ToolCall`]: { args: event.args } } }));
      }
    }
    const r = await run.wait();
    const u = r.usage;
    console.log(
      JSON.stringify({
        type: "result",
        subtype: r.status === "finished" ? "success" : "error",
        is_error: r.status !== "finished",
        duration_ms: r.durationMs ?? 0,
        result: r.result ?? "",
        usage: u
          ? { inputTokens: u.inputTokens, outputTokens: u.outputTokens, cacheReadTokens: u.cacheReadTokens, cacheWriteTokens: u.cacheWriteTokens }
          : undefined,
      }),
    );
  } finally {
    await agent[Symbol.asyncDispose]();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
