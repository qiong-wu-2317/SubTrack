# US-3 · Phase 2: Plan

> Written in Claude Code **plan mode** after [exploration](01-explore.md) and approved on 2026-11-22,
> before any US-3 code. Reproduced below unchanged. How execution differed from the plan is recorded in
> [03-workflow.md](03-workflow.md).

---

## US-3 Spend dashboard: implementation plan

### Context
US-3 asks for a dashboard showing total monthly spend, yearly spend, and spend by category. The project is
a bare scaffold: no Prisma models, nothing in `src/lib`, no services. So US-3 also has to lay
the domain foundation (money, cost normalization, status) and the first migration. The PRD rules
that apply are BR-1 (cents), BR-2 (monthly normalization), BR-5 (auto-expire), BR-6 (per-currency),
BR-8 (only active counts; trials reported separately), BR-9 (recurring fees), and BR-10 (yearly per cycle).
The output contract is already specified in `docs/API.md` § `GET /api/summary`.

User decisions:
- **Field names follow CLAUDE.md:** `nextRenewalDate`, `trialEndDate`, `startDate`, `endDate`. Update `API.md` to match.
- **The page reads through services:** the dashboard page and `GET /api/summary` both call one `getSpendSummary` service. Fix the `ARCHITECTURE.md` diagram to match.

US-1 (adding subscriptions) doesn't exist yet, so `prisma/seed.ts` provides fake data to look at.

### Calls I made (flag any you disagree with)
- **Rounding:** BR-2's "round at the end" applies per subscription. Each subscription's cost, including its recurring fees, is calculated as an exact fraction and rounded once, half up, with integer-only math (`roundDiv(n, d)`). Totals are sums of those integers, so the category rows always add up to the total.
- **Expired status is computed, not stored (BR-5):** `effectiveStatus(sub, now)` treats `autoRenew=false && endDate < now` as `expired`, whatever the stored status says. The summary takes `now`.
- **Fees use the subscription's currency.** `Fee` has no currency column.
- **Percent rounding:** `percent` uses the largest-remainder method so each currency's rows add up to exactly 100. `share = monthlyCents / total` is a float ratio, not money, and is `0` when the total is 0.
- **Top 5 on the dashboard:** keep the top 4 categories and merge the rest into `other`, alongside any existing `other` row. The API returns every row.
- **Where enum types live:** `src/lib` is pure and can't import `src/server`, so `src/lib/types.ts` declares the TypeScript unions. `schemas.ts` builds its `z.enum` from them and has a compile-time check that the two stay identical.

### Steps (TDD: write the failing test first in each lib step)

1. **`src/lib/money.ts`**: `Cents` branded type, `roundDiv`, `formatCents(cents, currency)`. `formatCents` is the only place that divides by 100, using `Intl.NumberFormat`.
2. **`src/lib/billing.ts`**: `monthlyCostCents(sub)` (BR-2, BR-9), `yearlyCostCents(sub)` (BR-10). The fraction per cycle:
   monthly: weekly 52/12, monthly 1/1, quarterly 1/3, yearly 1/12, custom 365/(12·intervalDays).
   yearly: weekly 52, monthly 12, quarterly 4, yearly 1, custom 365/intervalDays.
   The base amount is `amountCents + Σ recurring fees`. One-time fees are excluded.
3. **`src/lib/status.ts`**: `effectiveStatus(sub, now)` (BR-5).
4. **`src/lib/summary.ts`**: `summarizeSpend(subs, now)` returns `CurrencySummary[]` as defined in API.md. It covers BR-6 (group by currency, never sum across), BR-8 (only active counts; trials give `count` and `monthlyCentsAfterTrial`), category normalization (trim, lowercase, blank becomes `other`), `byCategory` sorted descending with share and percent, and `topSubscriptions` (top 3). Also `limitCategoryRows(rows, 5)`.
   Every BR gets a test named after it, e.g. `it("BR-8: paused, cancelled, expired excluded", …)`, plus edge cases: custom intervals, rounding ties, a zero total, and a currency with only trials.
5. **Prisma schema + migration `add_subscriptions`**: `Subscription` (name, vendor?, category, amountCents, currency, billingCycle, intervalDays?, startDate, nextRenewalDate, endDate?, trialEndDate?, autoRenew, status, paymentMethodId?, timestamps), `Fee` (subscriptionId with cascade delete, kind, amountCents, recurring), `PaymentMethod` (label, last4?). Enum fields are strings (ADR-6). `Payment` waits for US-6.
6. **`src/server/schemas.ts`**: the `BillingCycle`, `Status`, `FeeKind` and `Currency` (`/^[A-Z]{3}$/`) schemas, plus `SummaryQuerySchema`.
7. **`src/server/repo/subscriptions.ts`**: `listSubscriptionsWithFees()` maps Prisma rows to the domain types in `src/lib/types.ts`.
8. **`src/server/services/summary.ts`**: `getSpendSummary({ currency?, now })` loads data from the repo, calls `summarizeSpend`, and filters by currency.
   Integration test `summary.test.ts` runs against `file:./test.db`. A Vitest `globalSetup` deletes test.db and runs `prisma migrate deploy`, so no reset command is needed.
9. **`src/server/errors.ts`** + **`src/app/api/summary/route.ts`**: validate `currency` with Zod. Invalid input returns 400 `{ error: { code: "VALIDATION_ERROR", fields: { currency } } }`, and nothing leaks a stack trace.
10. **Dashboard UI**: `src/app/page.tsx` (a Server Component that calls `getSpendSummary({ now: new Date() })`; `now` is created here at the edge, never in domain code) with `src/components/CurrencySummaryCard.tsx` (monthly and yearly totals, active count, trials line) and `src/components/CategoryBreakdown.tsx` (5-row limit, bars sized by `percent`). It shows one card per currency and an empty state when there are no subscriptions. No `"use client"` is needed.
11. **`prisma/seed.ts`** + `"prisma": { "seed": … }` in package.json: fake data covering USD and EUR, every billing cycle, a trial, a paused subscription, an expired subscription, and recurring and one-time fees.
12. **Docs**: `API.md` (date field names), `ARCHITECTURE.md` (reads go through services), `CLAUDE.md` (BR-1…BR-10, add `yearlyCostCents` to the reuse list), `PROGRESS.md`.

Suggested commits: `feat: money and billing normalization` (1–3) · `feat: spend summary domain logic` (4) ·
`feat: subscription schema and summary service` (5–8) · `feat: summary API route` (9) · `feat: spend dashboard` (10–11) · `docs: …` (12).

### Critical files
`src/lib/{types,money,billing,status,summary}.ts` + tests · `prisma/schema.prisma` · `src/server/{schemas,errors}.ts` ·
`src/server/repo/subscriptions.ts` · `src/server/services/summary.ts` · `src/app/api/summary/route.ts` · `src/app/page.tsx` ·
`src/components/{CurrencySummaryCard,CategoryBreakdown}.tsx` · `prisma/seed.ts` · `vitest.config.ts` (globalSetup) · docs.
Reuse what exists: `src/server/repo/db.ts` (the Prisma client), the ESLint Prisma-import rule, and the 100% coverage threshold on `src/lib`.

### Verification
- `npx vitest run src/lib` while iterating, then `npm run test:coverage` (src/lib at 100% lines) and `npm run check`.
- `npm run db:migrate -- --name add_subscriptions`, then `npx prisma db seed`.
- `npm run dev`. Check that `/` shows separate USD and EUR cards with totals matching hand-computed seed values, that paused and expired subscriptions are excluded, that the trial is shown separately, and that there are at most 5 category rows.
- Check `curl localhost:3000/api/summary`, `?currency=EUR`, and `?currency=usd` (expect 400 `VALIDATION_ERROR`).
- `npx next build` succeeds.
