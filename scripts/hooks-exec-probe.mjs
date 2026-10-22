#!/usr/bin/env node
import { buildAgentArgs, detectAgentCli, normalizeStreamLines } from "../lib/agent-cli.mjs";

const cli = detectAgentCli();
if (!cli) {
  console.error("No agent CLI on PATH (tried agent, then cursor-agent; override with CURSOR_AGENT_BIN).");
  process.exit(2);
}
console.log(`agent CLI: ${cli.bin} (${cli.flavor}: ${cli.version.split("\n")[0]})`);
// Proves what a hook script without the exec bit does. Builds two throwaway
// workspaces with one beforeShellExecution hook that denies a probe command,
// then asks the real CLI agent to run that command.
//   1. hook WITHOUT the exec bit -> the hook cannot start -> fails open (command runs)
//   2. hook WITH the exec bit    -> the hook denies the command
// Also, with --fail-closed: a non-executable hook marked failClosed blocks.
// Spends a few cents of tokens. Needs the Cursor CLI (`agent`) and a login.
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PROBE = "echo exec-probe-ran";
const HOOK = `#!/usr/bin/env node
let raw = "";
for await (const c of process.stdin) raw += c;
const cmd = JSON.parse(raw || "{}").command ?? "";
process.stdout.write(JSON.stringify(cmd.includes("exec-probe-ran")
  ? { permission: "deny", user_message: "probe hook denied it", agent_message: "Denied by the probe hook. Report that it was denied." }
  : { permission: "allow" }));
`;

function workspace(executable, failClosed) {
  const dir = mkdtempSync(join(tmpdir(), "hook-exec-"));
  mkdirSync(join(dir, ".cursor/hooks"), { recursive: true });
  const script = join(dir, ".cursor/hooks/probe.mjs");
  writeFileSync(script, HOOK);
  chmodSync(script, executable ? 0o755 : 0o644);
  writeFileSync(
    join(dir, ".cursor/hooks.json"),
    JSON.stringify({ version: 1, hooks: { beforeShellExecution: [{ command: ".cursor/hooks/probe.mjs", timeout: 5, ...(failClosed ? { failClosed: true } : {}) }] } }, null, 2),
  );
  spawnSync("git", ["init", "-q"], { cwd: dir });
  return dir;
}

function ask(dir) {
  const r = spawnSync(
    cli.bin,
    buildAgentArgs(cli, {
      model: process.env.HARNESS_MODEL ?? "composer-2.5",
      prompt: `Run exactly this shell command once: ${PROBE}  Then reply with one word: RAN if you saw exec-probe-ran in the output, BLOCKED if the command was denied or did not run.`,
    }),
    { cwd: dir, encoding: "utf8", timeout: 300_000, maxBuffer: 64 * 1024 * 1024 },
  );
  const lines = normalizeStreamLines((r.stdout ?? "").split("\n"));
  const shellDone = lines.find((e) => e.type === "tool_call" && e.subtype === "completed" && e.tool_call?.shellToolCall);
  const shellResult = shellDone?.tool_call?.shellToolCall?.result ?? null;
  const final = lines.filter((e) => e.type === "result").at(-1)?.result ?? "";
  const ran = JSON.stringify(shellResult ?? "").includes("exec-probe-ran\\n") || /stdout[^}]*exec-probe-ran/.test(JSON.stringify(shellResult ?? ""));
  return { ran, shellResult: shellResult ? Object.keys(shellResult)[0] : "none", final: final.trim().slice(0, 120) };
}

const cases = [
  { name: "no exec bit, failClosed off", executable: false, failClosed: false },
  { name: "exec bit set,  failClosed off", executable: true, failClosed: false },
];
if (process.argv.includes("--fail-closed")) cases.push({ name: "no exec bit, failClosed ON", executable: false, failClosed: true });

for (const c of cases) {
  const r = ask(workspace(c.executable, c.failClosed));
  console.log(`${c.name}: command ${r.ran ? "RAN (hook did not stop it)" : "did NOT run"} | shell result: ${r.shellResult} | agent said: ${r.final}`);
}
