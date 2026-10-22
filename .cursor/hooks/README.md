# Project hooks

These scripts are the 401 guardrail demo. They live in `.cursor/hooks.json` so they ship with the repo. Do not copy them into `~/.cursor/hooks.json`. On an Intuit machine that file holds managed CodeAssist hooks, and replacing it turns those hooks off with no warning.

Checked against the hooks reference at https://cursor.com/docs/hooks on 14 October 2026.

## What is wired

| Event | Script | Decision |
| --- | --- | --- |
| `beforeSubmitPrompt` | `synthetic-prompt.mjs` | Blocks a non-`.example` address, an SSN-shaped number, or a live credential. `failClosed: true`. This is the 301 hook. |
| `beforeShellExecution` | `deny-dangerous-shell.mjs` | `permission: "deny"` for force-push, `git reset --hard`, a broad `rm -r`, `curl`/`wget` off localhost, `ssh`, `mkfs`, `dd`, and a fork bomb. |
| `beforeShellExecution` | `fail-closed-probe.mjs` | Allows every command until `missions/fail-closed-armed` exists, then exits 1. `failClosed: true`, so that exit blocks. |
| `preToolUse` | `deny-protected-write.mjs` | `permission: "deny"` for writes to the seed, `lib/tax-year.ts`, env files, and a user-level `hooks.json`. Matcher `Write\|Delete\|StrReplace\|EditNotebook`. |
| `afterFileEdit` | `format-edited.mjs` | Strips trailing whitespace on source files and appends a line to `.cursor/hook-logs/format.log`. |
| `subagentStart` | `limit-subagent.mjs` | Denies a `shell` subagent and any task that pastes a credential. |
| `stop` | `mission-loop.mjs` | If `missions/active.json` names a mission, runs its done-when command and may set `followup_message`. `loop_limit` is 3. |

Deny beats ask beats allow when Cursor merges hook sources. These scripts return deny or allow. They do not return ask.

## Intuit notes

- Put hooks in this project file. Editing `~/.cursor/hooks.json` can disable the managed audit logger.
- `preToolUse` accepts `"ask"` and does not enforce it. Use `"deny"`. On `subagentStart`, `"ask"` is treated as deny.
- Exit code 2 blocks the action. Any other non-zero exit fails open unless `failClosed` is true. The probe uses exit 1 plus `failClosed` so a crash-shaped failure blocks.
- The docs say Cursor reloads `hooks.json` on save, and to restart if hooks still do not load. The Intuit incident was stricter: a `failClosed` hook kept blocking until the session was restarted. If a hooks edit does not show up, start a new chat, then restart Cursor.
- `intuit-git-push-guard` is a managed hook. It is not in this repo. Off VPN it can block every shell command, including ones built from variables. Do not demo this repo from a cloud sandbox and expect that guard to pass.
- Hooks do not fire for every tool. The docs' `preToolUse` matcher list includes `Write`, `Delete`, and `Task`. If an edit tool uses another name, the protected-path hook will not see it.
- Cloud agents are out of scope for this workshop. Intuit keeps Projects, Automations, and cloud agents off. These hooks are for the local IDE and CLI.

## Exec bit (found 21 Oct 2026)

Cursor runs each `command` directly. It does not run it through `node`. A script without the exec bit cannot start. Verified with the CLI (`npm run hooks:exec-probe -- --fail-closed`, output in `fallback/hooks-exec-probe/`):

- no exec bit, `failClosed` off: the hook never runs, so the command runs (fails open, silently)
- exec bit set: the hook denies the command
- no exec bit, `failClosed` on: every matching command is blocked

`npm run hooks:smoke` now fails if any hook command lacks the bit. Fix: `chmod +x .cursor/hooks/*.mjs && git update-index --chmod=+x .cursor/hooks/*.mjs`.

## failClosed warning

Creating `missions/fail-closed-armed` blocks agent shell commands. Delete that file to recover. Do not arm it during the 301 session.

## Smoke

```bash
node scripts/hooks-smoke.mjs
```

That pipes sample JSON at the scripts. It does not prove the IDE fired the event. The Hooks tab in Customize is the IDE check.

## CSS token codemod (added 22 Oct 2026)

`migrate-css-tokens.mjs` (afterFileEdit) runs `migrations/css-tokens/codemod.mjs` on each edited `.css` file,
using `migrations/css-tokens/map.json`. It skips the codemod's fixtures and logs to `.cursor/hook-logs/migrate.log`.
Verified in the Cursor CLI on 22 Oct (see `fallback/css-tokens/2026-10-22.txt`). In the IDE: UNVERIFIED.

## Unified Grok Build CLI (found 22 Oct 2026)

`agent` 1.0.67 [unified] did not run these project hooks: `npm run hooks:exec-probe` showed the command RAN even with the exec bit set, and `agent inspect` lists "Hooks (None)". For hook demos use the IDE or the old CLI (`CURSOR_AGENT_BIN=cursor-agent`).
