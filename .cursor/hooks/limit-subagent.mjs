#!/usr/bin/env node
// subagentStart: shell subagents inherit the parent's shell tool and skip the
// parent's narration. Keep shell on the parent, where beforeShellExecution runs.
// "ask" is not a supported permission here; Cursor treats it as deny.

import { isDirectRun, readStdinJson, writeJson } from "./hook-io.mjs";

const CREDENTIAL = /CURSOR_API_KEY|BEGIN [A-Z ]*PRIVATE KEY|personal access token/i;

export function decideSubagent(input) {
  const type = typeof input.subagent_type === "string" ? input.subagent_type : "";
  const task = typeof input.task === "string" ? input.task : "";
  if (type === "shell") {
    return {
      permission: "deny",
      user_message: "Blocked a shell subagent. Run the command on the parent so the shell guardrail can see it.",
    };
  }
  if (CREDENTIAL.test(task)) {
    return {
      permission: "deny",
      user_message: "Blocked a subagent task that would handle a credential. Keep secrets in the environment, not the prompt.",
    };
  }
  return { permission: "allow" };
}

async function main() {
  const input = await readStdinJson();
  writeJson(decideSubagent(input));
}

if (isDirectRun(import.meta.url)) {
  await main();
}
