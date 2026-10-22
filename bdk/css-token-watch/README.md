# css-token-watch: a real BDK project

A small bot built with Cursor's Bot Development Kit (BDK, npm `@cursor/bdk` 0.2.27, docs at
[cursor.com/docs/bdk](https://cursor.com/docs/bdk)). It watches CSS design-token migrations across
many plugin repos. Plain code finds the legacy tokens. The model only explains and triages.

This folder is a standalone project with its own `package.json`. The demo app at the repo root
does not use it, and the root typecheck and lint skip it.

## How it maps to a CSS token migration use case

| The ask | The BDK piece | Status (Oct 21, 2026) |
|---|---|---|
| Codemod-style, deterministic output | `bot/tools/find_legacy_tokens.ts` calls `bot/lib/token-map.ts`. Same CSS in, same answer out. No model in this step. | Verified: `npm test`, `npm run tool:demo` |
| CI triggers across about 20 plugin repos | `bot/channels/github.ts` wakes the model only when a check suite fails on a PR. One server watches many repos: `bdk serve --dir . --cursor-events --repo org/plugin-a --repo org/plugin-b` (from the BDK GitHub guide). | Validates. Against real GitHub: UNVERIFIED |
| A daily 9 AM kickoff | `bot/schedules/morning-triage.md`, `cron: "0 13 * * 1-5"`. BDK cron is UTC: 9 AM ET in summer time, 8 AM ET in winter. Use `0 14 * * 1-5` after Nov 1. | Validates (`bdk info` lists it). Firing: UNVERIFIED |
| A regression gate on the bot | `evals/tokens.eval.ts` (2 smoke cases) and `.github/workflows/agent-evals.yml`: smoke evals on PRs that change the bot, the full suite on weekday mornings, JUnit uploaded. | Evals verified locally. The workflow was not run in GitHub Actions: UNVERIFIED |

Replace `TOKEN_MAP` in `bot/lib/token-map.ts` with your design-system map.

## Layout: tools vs judgment, evals, triggers

```text
css-token-watch/
  bot/agent.ts                  model config (BDK default: grok-4.5, effort high, fast)
  bot/instructions.md           judgment: the always-on prompt. Short.
  bot/tools/find_legacy_tokens.ts   tool: one typed tool per file, file name = tool name
  bot/lib/token-map.ts          plain code: the old -> new token map. Not a tool, never discovered.
  bot/channels/github.ts        trigger: wake only on a failed check suite
  bot/schedules/morning-triage.md   trigger: weekday cron (UTC)
  evals/tokens.eval.ts          evals: did it call the tool, name the right token, not invent one
  evals/evals.config.ts         required eval config
  test/token-map.test.ts        offline unit test of the deterministic step (node --test)
  .github/workflows/agent-evals.yml   CI gate (runs if this folder is its own repo)
  fallback/                     recorded output from Oct 21
```

The rule from the 401: plain code for fixed steps, the model only for judgment. The host code owns
the deterministic work. The instructions own wording and triage.

Memory is off on purpose. A BDK memory hook writes one shared journal for every session and every
user. For a bot that reads many repos, turn it on only after you decide who may read that journal.

## How to run it

Needs Node 22.13 or newer.

```bash
cd bdk/css-token-watch
npm ci
npm run verify:offline   # typecheck, unit tests, bdk validate, list evals. No API key, no tokens.
npm run tool:demo        # bdk call: runs the tool with no model turn. No API key, no tokens.
npm run info             # what BDK discovered: tools, channels, schedules
npm run eval:smoke       # 2 live eval cases. Spends tokens. Needs CURSOR_API_KEY or bdk login.
```

`npm run dev` starts the local server (`bdk dev`). It asks you to sign in. Not run for the 401.

Put the API key in the environment or a CI secret. Never in a file in this folder.

## Recorded output (verified Oct 21, 2026, Node 22.23.4, @cursor/bdk 0.2.27)

- `npm run verify:offline`: tsc clean, 4 of 4 unit tests pass, `ok: css-token-watch (css-token-watch) has no diagnostics`, 2 evals listed. See `fallback/2026-10-21-verify-offline.txt`.
- `npm run tool:demo` (run with no API key and not signed in): `"ok": true`, `"clean": false`, line 2 `--brand-blue` -> `--color-action-primary`, line 3 `--space-sm` -> `--spacing-200`, `durationMs` 2. See `fallback/2026-10-21-tool-demo.txt`.
- `npm run eval:smoke`: `2 passed, 0 failed, 2 total`, JUnit `tests="2" failures="0"`. See `fallback/2026-10-21-eval-smoke.txt`.

Notes from the runs:
- The line `[bdk] GitHub auth: gh auth token` appears when the GitHub CLI is installed. BDK reads the local gh login for the GitHub channel. The tool call does not need it.
- In one eval case the model first tried to read `src/card.css`, which does not exist, then called the tool. The case still passed.
- `[bdk:otel] error: ... You can only call end() on a span once.` was printed during evals. The evals passed. It looks like a BDK telemetry log, not a failure.

## Running without Cloud Agents

BDK can self-host, so each turn runs on your host. Check that this fits your org's policy (API key, network egress, the GitHub connection with `cursorAccount: true`). Some BDK templates, for example `pr-autofixer`, drive Cursor Cloud Agents, so they need Cloud Agents turned on.

BDK is public on npm under the Cursor SDK License. It is not open source.
