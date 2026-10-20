---
name: reset-demo-state
description: Run the scripted TurboTax Expert Ops demo reset first, then complete only the cleanup it reports. Use when a demo just ended, the data looks wrong, tests are unexpectedly red, or the dev server will not start.
---

# Reset the demo state

Run the script first. It is the source of truth for local cleanup.

```bash
npm run demo:reset
```

The command restores tracked files with `git reset --hard HEAD`, removes untracked files that demo beats create under `app/`, `components/`, `lib/`, `tests/`, and `.cursor/plans/`, switches to `main`, removes recorded personal rules, skills, Canvas files, and demo branches, reseeds SQLite, restarts port 43173, and confirms **0 failed / 59 passed**. It never runs a repo-wide `git clean` and never removes an unrecorded personal skill.

Add `--dry-run` first if you want to see the list before anything is removed.

## Session events

Start each demo session and record artifacts as they are created:

```bash
npm run demo:session -- start
npm run demo:session -- record skill "$HOME/.cursor/skills/<created-skill>"
npm run demo:session -- record branch <branch-name> --remote
```

The ignored `.cursor/demo-session-events.json` stores recorded paths and branches. Use `npm run demo:session -- status` to inspect it. One reset clears everything it knows about. Without the file, the command still resets tracked files and the demo output folders, and says so in `skipped`. When a demo beat creates a new kind of leftover, update `scripts/demo-reset.ts` and its event record in the same change.

## Remaining actions

Read the JSON report printed by `demo:reset`. Only complete its `remaining` actions:

- **Worktrees:** Build in Parallel leaves worktrees behind. The report lists any worktree other than this checkout. Remove each one with `git worktree remove <path>` after confirming it holds nothing you want.
- **Cursor user rule:** use the Cursor settings UI only for a recorded rule ID with no filesystem path. Do not remove unrelated user rules.
- **Project:** the script never touches cloud work. If the session used a Project, close its PRs, delete their branches, and remove its subscriptions from the Listening pill.

## Never

- Never edit a test, the seed, or `lib/tax-year.ts` to make the suite green.
- Never delete a path outside the script's allowlist.
- Never run the reset in a checkout whose `origin` is not this demo's repository.
