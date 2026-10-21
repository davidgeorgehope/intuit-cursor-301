// (c) Mission runner. The agent works the mission. After each run the harness
// (not the agent) runs the mission's done-when command. Exit 0 stops the loop.
// A non-zero exit sends one follow-up, up to the mission budget. Local runtime only.
// Usage: npm run sdk:mission -- [--mission extension-pace] [--cwd path] [--max 3]
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Agent } from "@cursor/sdk";
import { DEFAULT_MODEL, argValue, formatTokens, logEvent, reportCost, requireKey } from "./common";

type Mission = { title: string; outcome: string; doneWhen: string; doneWhenArgs: string[]; budget: { maxFollowups: number } };

function runDoneWhen(cwd: string, mission: Mission) {
  const [command, ...args] = mission.doneWhenArgs;
  const r = spawnSync(command, args, { cwd, encoding: "utf8", timeout: 120_000 });
  const exitCode = typeof r.status === "number" ? r.status : 1;
  const tail = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim().split("\n").slice(-12).join("\n");
  return { exitCode, tail };
}

async function main() {
  const apiKey = requireKey();
  const id = argValue("--mission", "extension-pace")!;
  const cwd = argValue("--cwd", process.cwd())!;
  const registry = JSON.parse(readFileSync(join(cwd, "missions/registry.json"), "utf8")) as Record<string, Mission>;
  const mission = registry[id];
  if (!mission) throw new Error(`Unknown mission ${id}`);
  const max = Number(argValue("--max", String(mission.budget.maxFollowups)));

  const before = runDoneWhen(cwd, mission);
  console.log(JSON.stringify({ type: "done_when", phase: "before", command: mission.doneWhen, exitCode: before.exitCode }));
  if (before.exitCode === 0) {
    console.log("done-when already passes. Plant the bug first: npm run mission:plant");
    return;
  }

  const agent = await Agent.create({
    apiKey,
    model: { id: DEFAULT_MODEL },
    local: { cwd, settingSources: ["project"] },
  });
  let prompt = [
    `Mission: ${mission.title}.`,
    `Outcome: ${mission.outcome}`,
    `Done when: \`${mission.doneWhen}\` exits 0.`,
    `Read missions/${id}/MISSION.md first. Stay inside the mission.`,
  ].join("\n");
  let turns = 0;
  let last = before;
  const tokens = { total: 0 };
  try {
    for (;;) {
      turns++;
      const run = await agent.send(prompt);
      for await (const event of run.stream()) logEvent(event);
      const result = await run.wait();
      tokens.total += result.usage?.totalTokens ?? 0;
      console.log(JSON.stringify({ type: "turn", turn: turns, status: result.status, durationMs: result.durationMs }));
      console.log(formatTokens(result.usage));
      last = runDoneWhen(cwd, mission);
      console.log(JSON.stringify({ type: "done_when", phase: `after turn ${turns}`, exitCode: last.exitCode }));
      if (last.exitCode === 0 || turns > max) break;
      prompt = `\`${mission.doneWhen}\` still exits ${last.exitCode}. Output tail:\n${last.tail}\nThis is follow-up ${turns} of ${max}. Fix the cause, then run the command yourself.`;
    }
    console.log(
      JSON.stringify({ type: "result", mission: id, passed: last.exitCode === 0, turns, totalTokens: tokens.total }),
    );
    console.log(await reportCost(agent));
    if (last.exitCode !== 0) process.exitCode = 1;
  } finally {
    await agent[Symbol.asyncDispose]();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
