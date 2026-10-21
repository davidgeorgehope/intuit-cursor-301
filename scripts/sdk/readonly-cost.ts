// (a) Read-only run. disallowedTools removes shell, edit, and delete, so the
// agent can read but cannot change anything. Prints tokens and dollars per run.
// Usage: npm run sdk:readonly -- [--mission extension-pace] [--cwd path]
import { Agent } from "@cursor/sdk";
import { DEFAULT_MODEL, argValue, formatTokens, logEvent, reportCost, requireKey } from "./common";

async function main() {
  const apiKey = requireKey();
  const mission = argValue("--mission", "extension-pace");
  const cwd = argValue("--cwd", process.cwd())!;

  const agent = await Agent.create({
    apiKey,
    model: { id: DEFAULT_MODEL },
    disallowedTools: ["shell", "edit", "delete", "applyAgentDiff", "webFetch", "webSearch", "mcp"],
    local: { cwd },
  });

  try {
    const run = await agent.send(
      `Read missions/${mission}/MISSION.md. Answer in two lines: line 1 is the exact done-when command, line 2 is PRESENT or MISSING. Do not edit files.`,
    );
    for await (const event of run.stream()) logEvent(event);
    const result = await run.wait();
    console.log(JSON.stringify({ type: "result", status: result.status, model: result.model?.id, durationMs: result.durationMs }));
    console.log("result:", (result.result ?? "").trim());
    console.log(formatTokens(result.usage));
    console.log(await reportCost(agent));
  } finally {
    await agent[Symbol.asyncDispose]();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
