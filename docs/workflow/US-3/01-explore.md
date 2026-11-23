# US-3 · Phase 1: Explore

> Recorded from the Claude Code session that built US-3 (2026-11-22). This is what was read, what was
> found, and what was asked before any US-3 code was planned or written.

## Goal
PRD **US-3**: "I see a dashboard: total monthly spend, yearly spend, spend by category."

## What was read
- `CLAUDE.md`: stack, layering, money and date conventions, testing strategy, do's and don'ts
- `docs/PRD.md`: US-1…US-8, BR-1…BR-10, core entities, non-goals
- `docs/ARCHITECTURE.md`: layers and ADR-1…ADR-6
- `docs/API.md`: Server Actions, REST routes, the `GET /api/summary` contract, error shape
- The repo itself: only the scaffold existed (tooling, empty Prisma schema, placeholder page)

## Findings

### Starting state
- No Prisma models, nothing in `src/lib`, no services, repo, routes or components.
  US-3 therefore also has to lay the domain foundation: money, cost normalization, status,
  and the first migration.
- US-1 (add a subscription) doesn't exist, so there is no way to get data in. A fake-data seed is needed
  to see and verify the dashboard.

### Conflicts between the docs
| # | Conflict | Where |
|---|---|---|
| 1 | `CLAUDE.md` cites BR-1…BR-7; the PRD defines **BR-1…BR-10**, and BR-8/9/10 drive US-3 | CLAUDE.md vs PRD |
| 2 | `API.md` uses `nextRenewal`; the CLAUDE.md naming rule requires a `Date` suffix for calendar days (`nextRenewalDate`) | API.md vs CLAUDE.md |
| 3 | The ARCHITECTURE.md diagram shows Server Components reading the **repo** directly; CLAUDE.md says every path goes UI → services → repo, with no business logic in components | ARCHITECTURE.md vs CLAUDE.md |
| 4 | `/api/summary` returns `share: 0.37`, a float, while CLAUDE.md bans floats. It's a ratio, not money, so it's allowed, but this needed confirming | API.md vs CLAUDE.md |

### Requirements that shape the design
- `percent` must add up to 100 per currency, which needs a deliberate rounding method (largest remainder).
- BR-2 says "round at the end" without saying *the end of what*. That determines whether category rows add up to the total.
- BR-5 (auto-expire) depends on "now", so it must be computed at read time and pages must not be cached.
- BR-4 has no `trial → expired` or `paused → expired` transition, which limits where BR-5 applies.
- The dashboard caps categories at 5 rows; the API returns every category.

### Out of scope for US-3, recorded as open questions
- `REMINDER_LEAD_DAYS` has no value (US-5).
- `logPayment` input lacks the currency and period fields the PRD lists for Payment (US-6).
- Whether a paused subscription's renewal date advances (US-2/US-6).

### Environment notes
- npm 11 blocks package install scripts by default. Prisma and esbuild need an explicit `allowScripts` approval.
- A stray lockfile in a parent folder made Next.js guess the wrong workspace root, so it has to be pinned in `next.config.ts`.

## Questions asked and answers
| Question | Answer |
|---|---|
| Which date field names should the Subscription model use (conflict 2)? | **Follow CLAUDE.md**: `nextRenewalDate`, `trialEndDate`, `startDate`, `endDate`. Update API.md. |
| How should the dashboard get its data (conflict 3)? | **Through services**: the page and `GET /api/summary` share `getSpendSummary`. Fix the ARCHITECTURE.md diagram. |

Next: [02-plan.md](02-plan.md)
