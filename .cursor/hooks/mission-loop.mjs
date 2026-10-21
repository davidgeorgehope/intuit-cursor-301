#!/usr/bin/env node
// stop: same decision order as the public ralph-loop plugin (MIT,
// github.com/cursor/plugins/tree/main/ralph-loop). No state file means stop.
// A passing done-when command clears the state. A follow-up continues until
// the mission budget. hooks.json loop_limit is 3. This file is original.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { isDirectRun, projectRoot, readStdinJson, writeJson } from "./hook-io.mjs";

export function readArmedId(root) {
  const armPath = join(root, "missions/active.json");
  if (!existsSync(armPath)) return null;
  try {
    const parsed = JSON.parse(readFileSync(armPath, "utf8"));
    return typeof parsed.id === "string" ? parsed.id : null;
  } catch {
    return null;
  }
}

export function decideFollowup(input) {
  const { status, loopCount, mission, exitCode } = input;
  if (!mission) return {};
  if (status && status !== "completed") return {};
  if (exitCode === 0) return { clear: true };
  if (loopCount >= mission.budget.maxFollowups) {
    return { escalate: true };
  }
  const next = loopCount + 1;
  return {
    followup_message: [
      `Mission ${mission.id} is not done.`,
      `\`${mission.doneWhen}\` exited ${exitCode}.`,
      mission.outcome,
      `This is follow-up ${next} of ${mission.budget.maxFollowups}.`,
      "Stay inside the mission. Do not edit lib/tax-year.ts or the seed.",
    ].join(" "),
  };
}

function loadMission(root, id) {
  const registry = JSON.parse(readFileSync(join(root, "missions/registry.json"), "utf8"));
  const mission = registry[id];
  if (!mission || !Array.isArray(mission.doneWhenArgs)) return null;
  return { id, ...mission };
}

function runDoneWhen(root, mission) {
  const [command, ...args] = mission.doneWhenArgs;
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    timeout: 90_000,
  });
  return typeof result.status === "number" ? result.status : 1;
}

function writeEscalation(root, mission, exitCode) {
  const dir = join(root, "missions");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "escalation.md"),
    `# Escalation: ${mission.id}\n\nThe stop hook reached ${mission.budget.maxFollowups} follow-ups and the done-when command still failed.\n\nCommand: ${mission.doneWhen}\nExit: ${exitCode}\n\nA person should look at this. The agent should stop.\n`,
  );
}

async function main() {
  const input = await readStdinJson();
  const root = projectRoot();
  const id = readArmedId(root);
  const mission = id ? loadMission(root, id) : null;
  if (!mission) {
    writeJson({});
    return;
  }
  const exitCode = runDoneWhen(root, mission);
  const loopCount = typeof input.loop_count === "number" ? input.loop_count : 0;
  const decision = decideFollowup({
    status: input.status,
    loopCount,
    mission,
    exitCode,
  });
  if (decision.escalate) writeEscalation(root, mission, exitCode);
  if (decision.clear || decision.escalate) rmSync(join(root, "missions/active.json"), { force: true });
  writeJson(decision.followup_message ? { followup_message: decision.followup_message } : {});
}

if (isDirectRun(import.meta.url)) {
  await main();
}
