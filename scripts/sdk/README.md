# Cursor SDK scripts (local runtime only)

`@cursor/sdk` 1.0.40. Needs Node 22.13+ and `CURSOR_API_KEY` (a user key from the Cursor dashboard, or a service-account key). These scripts never pass `cloud`.

| Script | npm | What it shows |
| --- | --- | --- |
| `readonly-cost.ts` | `npm run sdk:readonly` | `disallowedTools` removes shell, edit, delete. Prints tokens per run and tries `agent.getUsage()` for dollars. |
| `steer.ts` | `npm run sdk:steer` | `run.steer()` changes the task while the run is live. Prints the steer outcome. |
| `mission-runner.ts` | `npm run sdk:mission` | The harness runs done-when after each turn and stops on exit 0, or sends a follow-up up to the mission budget. |
| `one-shot.ts` | (used by `harness:ready-vs-bare -- --runner sdk`) | One prompt, stream-json-shaped output. |

`npm run harness:mission -- --sdk` calls `mission-runner.ts`. Add `--read-only` to call `readonly-cost.ts`.

Dollars: on 21 Oct 2026 `agent.getUsage()` on a local agent returned `feature_unavailable` for this account. The docs say local-agent usage is rolled out per account. Until then, read tokens from `result.usage` and dollars from the usage dashboard (SDK tag). Recorded output: `fallback/sdk/`.
