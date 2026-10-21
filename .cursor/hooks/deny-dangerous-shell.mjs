#!/usr/bin/env node
// beforeShellExecution: deny a short list of destructive or off-host commands.
// Returns deny, never ask. preToolUse "ask" is not enforced; this hook is a
// different event, and ask would still be the wrong call for these commands.

import { isDirectRun, readStdinJson, writeJson } from "./hook-io.mjs";

const FORCE_PUSH = /\bgit\s+push\b[\s\S]*(\s--force\b|\s-f\b|\s--force-with-lease\b)/;
const RESET_HARD = /\bgit\s+reset\s+--hard\b/;
const RM_BROAD = /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*|--recursive)\b/;
const SSH = /\bssh\b/;
const MKFS = /\bmkfs(\.\w+)?\b/;
const DD = /\bdd\s+if=/;
const FORK_BOMB = /:\(\)\s*\{/;

export function externalFetch(command) {
  if (!/\b(curl|wget)\b/.test(command)) return false;
  const urls = command.match(/https?:\/\/[^\s'"]+/g) ?? [];
  if (urls.length === 0) return false;
  return urls.some((url) => {
    try {
      const host = new URL(url).hostname;
      return host !== "127.0.0.1" && host !== "localhost" && host !== "[::1]";
    } catch {
      return true;
    }
  });
}

export function decideShell(command) {
  if (typeof command !== "string" || command.trim() === "") {
    return { permission: "allow" };
  }
  const reasons = [];
  if (FORCE_PUSH.test(command)) reasons.push("force-push");
  if (RESET_HARD.test(command)) reasons.push("git reset --hard");
  if (RM_BROAD.test(command) && /(\s\/(\s|$)|~|\s\*)/.test(command)) reasons.push("broad rm -r");
  if (externalFetch(command)) reasons.push("curl or wget to a host other than localhost");
  if (SSH.test(command)) reasons.push("ssh");
  if (MKFS.test(command)) reasons.push("mkfs");
  if (DD.test(command)) reasons.push("dd");
  if (FORK_BOMB.test(command)) reasons.push("fork bomb");
  if (reasons.length === 0) return { permission: "allow" };
  const why = reasons.join(", ");
  return {
    permission: "deny",
    user_message: `Blocked a shell command (${why}).`,
    agent_message: `Blocked (${why}). Do not retry with a renamed command. Ask the operator if the work actually needs it.`,
  };
}

async function main() {
  const input = await readStdinJson();
  const command = typeof input.command === "string" ? input.command : "";
  writeJson(decideShell(command));
}

if (isDirectRun(import.meta.url)) {
  await main();
}
