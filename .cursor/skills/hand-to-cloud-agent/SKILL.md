---
name: hand-to-cloud-agent
description: Hands TurboTax Expert Ops work to Cloud Agents. Use for durable /goal runs, /autopilot PR supervision, or /orchestrate planner/worker/verifier trees. Not for a local /loop.
---

# Hand work to a Cloud Agent

Local `/loop` lives inside this session and dies when the laptop closes. A Cloud Agent can hold a `/goal`, supervise a PR with `/autopilot`, or staff an `/orchestrate` tree. The repo must be connected to Cursor's GitHub app first.

## When to use

- `/goal` and the finish line will take longer than this sitting, or must continue after the laptop closes.
- `/autopilot` — an open PR needs event-driven passes over conflicts, comments, and checks.
- `/orchestrate` — a root planner decomposes the work; workers are isolated; verifiers check the result.

## Projects

A Project is the native home for work that outlives one chat. Its coordinator plans and delegates to Cloud Agents, keeps shared notes every agent reads, and acts on subscriptions (Slack, PRs, CI, or a schedule). The user creates it in the Agents Window under Projects > New Project with this repository as the workspace; an agent cannot create one. The coordinator starter, the shared-notes prompt, and a subscription example are the optional beats at the end of the orchestrate section on `/runbooks/301`.

## /goal in the cloud

Scope the finish line so it is verifiable: every done-when line in the plan passes, `npm test` is green, and the changed page shows the feature on port 43173. The agent judges when the objective is met; you review.

## /autopilot

The former `/babysit` PR workflow is now the `/autopilot` built-in skill. It needs a real open PR. Refresh live PR state each pass, handle conflicts before comments before CI, stop on ambiguous intent, and leave the merge decision to the human.

## /orchestrate

This one is a **plugin**, not built in. Before running it:

- `bun` on PATH
- `CURSOR_API_KEY` — a personal key or a team service account, not a team admin key
- Slack is optional and mirrors the run in a thread

The root planner writes no code. Workers are isolated; every handoff points up. Split work along the plan's session cards. Name `acceptance-verifier` as the verifier. Republish a task if a verifier fails.

## What you keep

You review and merge. Do not treat a green verifier or merge-ready PR as a ship decision.
