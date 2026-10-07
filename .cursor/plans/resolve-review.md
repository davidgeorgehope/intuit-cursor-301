# Finish credit-review resolution — three parallel agents

Chat prompt:

```
/multitask @resolve-review.md
```

Coordinator behavior (no wrapper Task, the first Tasks are the named workers, the contract goes in each prompt) is `.cursor/rules/multitask-no-wrapper.mdc`. Launch shape is `.cursor/skills/dispatch-subagents/SKILL.md`. Do not implement in the parent.

## Goal

Enable **Approve credit** and **Decline** on the credit review page so the status and an expert note persist. On approve, store the allowed credit for the review's credit type and qualified expenses — never the claimed amount.

`rev_1043` claims $4,000 of AOTC on $4,000 of expenses. That is valid input; the stored credit on approve must be **$2,500** (250000 cents). `npm test` stays green. Do not touch the seed or `lib/tax-year.ts`.

## Run order

Before `/multitask`: reseed so `rev_1043` is not a leftover `APPROVED` or `DECLINED` (`npx prisma db seed`), and make sure `npm run dev` is Ready on **43173**.

1. Same turn: launch Agent 1, Agent 2, and Agent 3 on isolated worktrees. Exactly three implementers.
2. When all three finish, summarize each worktree's diff (paths must be disjoint) and apply **helper → API → UI**. A conflict means an agent edited a sibling's file — revert that hunk.
3. Same turn after apply: `turbotax-reviewer` on the combined diff **and** `acceptance-verifier` on this plan. They do not depend on each other.

A 501 from the UI or API mid-run is expected until the helper worktree is applied.

## Shared contract (do not fork)

**`resolveReview` input** (already exported from `lib/reviews/resolve.ts`):

```ts
{ reviewId: string; action: "approve" | "decline"; expertNote?: string }
```

**HTTP** — `POST /api/reviews/[id]/resolve`

- Body: `{ action: "approve" | "decline", expertNote?: string }`
- 400 if `action` is missing or not `approve`/`decline`: `{ error: "action must be approve or decline" }`
- 200 on helper success: `{ ok: true }`
- 404 `{ error: "Review not found" }` for an unknown review
- Helper throws "not implemented": 501 until the helper is real

**Persist (helper only, via Prisma — never in the route):**

- `approve` → status `APPROVED`; `decline` → `DECLINED`
- Save the optional `expertNote`
- On approve only: `allowedCreditCents = allowedEducationCreditCents({ credit, qualifiedExpensesCents })`

## Agents

### Agent 1 — resolve helper

- **Owns:** `lib/reviews/resolve.ts` only
- **Done when:** for `rev_1043` and `approve`, the stored credit is 250000 cents, not 400000. `decline` sets `DECLINED` and does not raise the credit. A missing id throws a not-found error the route can map.

### Agent 2 — resolve API route

- **Owns:** `app/api/reviews/[id]/resolve/route.ts` only
- **Done when:** a bad `action` returns 400; the route still calls `resolveReview` and has no `prisma.` import; after the helper lands, `POST /api/reviews/rev_1043/resolve` with `{ "action": "approve", "expertNote": "…" }` returns 200 `{ ok: true }`.

### Agent 3 — resolution panel

- **Owns:** `app/reviews/[id]/page.tsx` and one small client child if the page stays a server component (for example `components/reviews/resolution-panel.tsx`)
- **Done when:** Approve and Decline are enabled, the POST body is `{ action, expertNote }`, and after the helper and API land, the status and note persist on `/reviews/rev_1043` across a reload.

Out of scope for all three: the seed, `lib/tax-year.ts`, writing new tests, a fourth worktree.
