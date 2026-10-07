---
name: start-expert-ops
description: Start the TurboTax Expert Ops Next.js app on port 43173, seed SQLite only when the database is missing or empty, then open it in the Cursor Browser with a second tab on the runbooks view. Use when the user asks to start the server, start the application, run the demo app, open the app in the browser, or seed if it has not already been seeded.
---

# Start TurboTax Expert Ops

Bring up the app. Do not reset demo state, restore files, or kill a healthy server.

Listen on **43173**. Schema URL is `file:./dev.db` in `prisma/schema.prisma`. The seed is idempotent (`prisma db push`, then the synthetic filers) but **skip it when data is already there**.

## 1. Dependencies

If `node_modules` is missing:

```bash
npm i
npx prisma generate
```

## 2. Seed only if needed

The database needs a seed when `prisma/dev.db` is missing, Prisma cannot query `TaxReturn`, or `taxReturn.count()` is `0`.

```bash
npx tsx -e '
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
(async () => {
  try {
    const n = await prisma.taxReturn.count();
    console.log(n > 0 ? "seeded" : "empty");
  } catch {
    console.log("missing");
  } finally {
    await prisma.$disconnect();
  }
})();
'
```

`tsx -e` compiles to CommonJS, so the check runs inside an async function; top-level `await` fails there.

- `seeded` — do not seed.
- `empty` or `missing` — run `npx prisma db seed`.

Never run `npm run db:reset` from this skill. That belongs to `reset-demo-state`.

## 3. Start the server

If a terminal already has `npm run dev` on **43173**, or `http://127.0.0.1:43173` responds, leave it. Report the URL.

Otherwise start in the background:

```bash
npm run dev
```

Request host or `all` permissions if bind fails (`uv_interface_addresses` or similar). Wait until the log shows Ready / `http://localhost:43173`.

Do not `lsof | kill` a busy 43173 — that is a reset, not a start.

## 4. Open the Cursor Browser

After the server is Ready (or already responding), open the app in the Cursor Browser (`cursor-ide-browser`). Do this even when the server was already running. Use `position: "active"` so the browser is visible.

1. Navigate to **http://localhost:43173** (the dashboard).
2. Open a **second tab** (`newTab: true`) to the runbooks view: **http://localhost:43173/runbooks/301**.

Do not use an external browser. Do not replace the first tab with the runbooks view.

## 5. Confirm

Report **http://localhost:43173** and **http://localhost:43173/runbooks/301**, and whether you seeded or skipped the seed.
