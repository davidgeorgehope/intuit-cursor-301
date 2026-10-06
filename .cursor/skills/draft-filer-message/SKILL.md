---
name: draft-filer-message
description: Draft an on-voice message from a tax expert to a filer — fix an e-file reject, ask for a missing form, or explain a credit review — from TurboTax Expert Ops seed data. Use when a demo asks for filer-facing copy, e.g. "write the message for the TY25-1042 reject".
---

# Draft a filer message

Write the message Avery Quinn (Tax expert, TurboTax Expert Ops) would send. Ground every fact in the seed; invent nothing.

## Pull facts first

- Return and filer facts from the seed (`prisma/seed.ts`, `prisma/extra-filers.ts`) or the running API: `http://127.0.0.1:43173/api/returns/ret_1042`.
- Reject meanings and fixes from `lib/rejects.ts`. Credit limits and deadlines from `lib/tax-year.ts`.
- Days to the extension deadline: compute against the frozen clock (Oct 8, 2026) — Oct 15 is 7 days out.

## Voice

Calm, specific, short. "Return", "refund", and "credit". No exclamation marks, no guarantees about refund timing, no legal threats.

## Hard rules

- Never include an SSN, not even the last four digits. Refer to the return number instead.
- Never ask the filer to send an SSN, IP PIN, or prior-year AGI by email. Point them to the secure place to enter it in their return.
- Credit amounts come from the review's allowed credit, never the claimed amount.
- Fictional parties only — seeded filers, `.example` addresses, signed "Avery Quinn, Tax expert".

## Output shape

Subject line, a body under 140 words, and one clear ask: re-enter last year's AGI, add the IP PIN, upload the corrected form, or confirm enrollment.
