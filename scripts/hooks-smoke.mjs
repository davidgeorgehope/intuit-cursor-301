#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { accessSync, constants, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function run(script, payload) {
  return spawnSync("node", [join(root, script)], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    env: { ...process.env, CURSOR_PROJECT_DIR: root },
  });
}

function show(label, result) {
  console.log(`${label} exit ${result.status} ${result.stdout || result.stderr}`);
  return result;
}

const deny = show(
  "deny force-push",
  run(".cursor/hooks/deny-dangerous-shell.mjs", { command: "git push --force origin main" }),
);
const allow = show(
  "allow npm test",
  run(".cursor/hooks/deny-dangerous-shell.mjs", { command: "npm test" }),
);
const write = show(
  "deny tax-year write",
  run(".cursor/hooks/deny-protected-write.mjs", {
    tool_name: "Write",
    tool_input: { path: join(root, "lib/tax-year.ts") },
    workspace_roots: [root],
  }),
);
const subagent = show(
  "deny shell subagent",
  run(".cursor/hooks/limit-subagent.mjs", { subagent_type: "shell", task: "list files" }),
);
const failClosed = show("failClosed unarmed", run(".cursor/hooks/fail-closed-probe.mjs", {}));

const denyBody = JSON.parse(deny.stdout);
const allowBody = JSON.parse(allow.stdout);
const writeBody = JSON.parse(write.stdout);
const subagentBody = JSON.parse(subagent.stdout);
const failBody = JSON.parse(failClosed.stdout);

if (deny.status !== 0 || denyBody.permission !== "deny") process.exit(1);
if (allow.status !== 0 || allowBody.permission !== "allow") process.exit(1);
if (write.status !== 0 || writeBody.permission !== "deny") process.exit(1);
if (subagent.status !== 0 || subagentBody.permission !== "deny") process.exit(1);
if (failClosed.status !== 0 || failBody.permission !== "allow") process.exit(1);

// Cursor runs each hook command directly, not through `node`. A script without
// the exec bit cannot start: a normal hook then fails open (the action runs),
// and a failClosed hook blocks everything. Piping JSON through `node` above
// cannot catch that, so check the bit here. Proof: npm run hooks:exec-probe.
const config = JSON.parse(readFileSync(join(root, ".cursor/hooks.json"), "utf8"));
const commands = new Set(Object.values(config.hooks).flat().map((h) => h.command));
const notExecutable = [...commands].filter((command) => {
  try {
    accessSync(join(root, command), constants.X_OK);
    return false;
  } catch {
    return true;
  }
});
if (notExecutable.length > 0) {
  console.log(`NOT EXECUTABLE (fails open, or blocks if failClosed): ${notExecutable.join(", ")}`);
  console.log("Fix: chmod +x .cursor/hooks/*.mjs && git update-index --chmod=+x .cursor/hooks/*.mjs");
  process.exit(1);
}
console.log(`exec bit set on all ${commands.size} hook commands`);
