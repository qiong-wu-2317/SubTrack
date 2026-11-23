# Progress

## Done
- **Scaffold:** Next.js 15.5 (App Router), React 19, TypeScript strict + `noUncheckedIndexedAccess`,
  Tailwind 4, Prisma 6 (SQLite), Zod 4, date-fns 4, Vitest 3, Playwright. npm 11 `allowScripts`
  approves install scripts only for `prisma`, `@prisma/client`, `@prisma/engines` and `esbuild`.

## In progress: US-3 spend dashboard, strict TDD restart (RED)
Plan: `~/.claude/plans/i-want-to-implement-zesty-snowflake.md`. The first build was test-after, so it was
moved to branch `backup/us3-test-after` (reference only; don't copy from it). On `main`:
- **In place:** migration `add_subscriptions` (Subscription, Fee, PaymentMethod), `prisma/seed.ts`,
  the domain types in `src/lib/types.ts`, and the docs decisions below.
- **Red:** 95 tests, 92 failing. Each one fails in its own feature: the stub throws `Not implemented: <fn>`,
  or the UI renders nothing. The 3 passing tests are `types.test.ts`, which pins the domain value lists
  kept as interface.
- **Stubs to implement (green), in order:** `src/lib/money.ts` → `billing.ts` → `status.ts` → `summary.ts`
  → `src/server/{schemas,errors}.ts` + `repo/subscriptions.ts` → `services/summary.ts` →
  `app/api/summary/route.ts` → `components/{CategoryBreakdown,CurrencySummaryCard}.tsx` → `app/page.tsx`.
- UI tests render with `react-dom/server` (`tests/render.ts`) and assume the `en-US` locale for currency strings.

## Decisions made during US-3
- Date fields use the `Date` suffix (`nextRenewalDate`, `trialEndDate`); `API.md` was updated to match.
- Pages read through services; the `ARCHITECTURE.md` diagram was updated to match.
- Rounding: once per subscription (amount + recurring fees), half up; totals are sums of those rounded values.
- BR-5 is computed (`effectiveStatus`), not written to the DB. It applies to `active` and `cancelled` only
  (BR-4 has no trial/paused → expired edge), and starts the day after `endDate`.
- Fees use the subscription's currency (no currency column on Fee).

## Next
- US-1 add subscription (form + `createSubscription` action + `SubscriptionInputSchema`).
- US-6 log payment: `advanceRenewal` (BR-3 month-end clamp) + Payment model.
- E2E: install chromium; replace the smoke test with the critical flows.

## Open questions
- `REMINDER_LEAD_DAYS` default value and where it is configured (US-5).
- `logPayment` input: currency and period start/end (PRD Payment entity) are missing from `API.md`.
- Does a paused subscription's renewal date advance? Should BR-5 also expire a trial whose `endDate` has passed?
- Should a background job ever persist `expired` to the DB, or is the computed status enough?
