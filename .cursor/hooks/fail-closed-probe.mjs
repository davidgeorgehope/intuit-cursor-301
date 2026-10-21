#!/usr/bin/env node
// beforeShellExecution, failClosed: true.
// Unarmed, this script exits 0 and allows the command. A crash in that path
// would block every shell command, so the unarmed path stays trivial.
// Armed (missions/fail-closed-armed exists), it exits 1 on purpose. Because
// failClosed is set, that non-zero exit blocks the command. Exit 2 would also
// block, as an explicit deny. Delete the arm file to recover. The arm file is
// read on each command. hooks.json itself is reloaded on save; if a hooks.json
// edit does not take effect, restart Cursor.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { isDirectRun, projectRoot, writeJson } from "./hook-io.mjs";

export const ARM_RELATIVE = "missions/fail-closed-armed";

export function decideFailClosed(armed) {
  if (!armed) return { exitCode: 0, body: { permission: "allow" } };
  return {
    exitCode: 1,
    stderr:
      "failClosed demo is armed. Shell commands are blocked until you delete missions/fail-closed-armed. This exit is 1, not a clean deny: failClosed turns a crash into a block.\n",
  };
}

async function main() {
  const decision = decideFailClosed(existsSync(join(projectRoot(), ARM_RELATIVE)));
  if (decision.stderr) process.stderr.write(decision.stderr);
  if (decision.body) writeJson(decision.body);
  process.exitCode = decision.exitCode;
}

if (isDirectRun(import.meta.url)) {
  await main();
}
