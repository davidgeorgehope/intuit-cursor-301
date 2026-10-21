// (b) Steer a run while it is still working. run.steer() injects a message into
// the live turn. "complete_delivered" means the turn took it. Anything else
// means send it as a follow-up after the run. Local runtime only.
// Usage: npm run sdk:steer
import { Agent } from "@cursor/sdk";
import { DEFAULT_MODEL, formatTokens, logEvent, reportCost, requireKey } from "./common";

const STEER = "Change of plan: stop the survey. Answer only this: which file defines the extension deadline date, and what is the date? One sentence.";

async function main() {
  const apiKey = requireKey();
  const agent = await Agent.create({
    apiKey,
    model: { id: DEFAULT_MODEL },
    disallowedTools: ["shell", "edit", "delete", "applyAgentDiff"],
    local: { cwd: process.cwd() },
  });
  try {
    const run = await agent.send(
      "Survey every file under lib/. For each file write one line on what it does. Do not edit files.",
    );
    let steered = false;
    let toolCallsBeforeSteer = 0;
    let toolCallsAfterSteer = 0;
    for await (const event of run.stream()) {
      logEvent(event);
      if (event.type === "tool_call" && event.status === "completed") {
        if (steered) toolCallsAfterSteer++;
        else toolCallsBeforeSteer++;
      }
      if (!steered && event.type === "tool_call" && event.status === "completed") {
        steered = true;
        if (!run.steer) {
          console.log(JSON.stringify({ type: "steer", outcome: "unsupported" }));
          continue;
        }
        const outcome = await run.steer(STEER);
        console.log(JSON.stringify({ type: "steer", outcome }));
        if (outcome !== "complete_delivered") {
          await run.wait();
          const follow = await agent.send(STEER);
          console.log("follow-up result:", ((await follow.wait()).result ?? "").trim());
        }
      }
    }
    const result = await run.wait();
    console.log(JSON.stringify({ type: "result", status: result.status, toolCallsBeforeSteer, toolCallsAfterSteer, durationMs: result.durationMs }));
    console.log("result:", (result.result ?? "").trim().slice(-600));
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
