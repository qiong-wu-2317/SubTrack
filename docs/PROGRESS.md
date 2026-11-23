# Progress

## Done
- **Scaffold:** Next.js 15.5 (App Router), React 19, TypeScript strict + `noUncheckedIndexedAccess`,
  Tailwind 4, Prisma 6 (SQLite), Zod 4, date-fns 4, Vitest 3, Playwright. npm 11 `allowScripts`
  approves install scripts only for `prisma`, `@prisma/client`, `@prisma/engines` and `esbuild`.
- **US-3 spend dashboard**, built with strict TDD (plan: `~/.claude/plans/i-want-to-implement-zesty-snowflake.md`).
  Red commit `2e1d8c7` (95 tests, 92 failing in their own feature), then green one layer at a time.
  The earlier test-after build is kept on branch `backup/us3-test-after` for the record only.
  - Domain (`src/lib`, 100% line coverage): `money` (BR-1), `billing` (BR-2, BR-9, BR-10),
    `status` (BR-4, BR-5), `summary` (BR-6, BR-8, category rows, percents, top 3, 5-row rollup).
  - Migration `add_subscriptions`: Subscription, Fee and PaymentMethod. Payment comes with US-6.
  - `getSpendSummary` service, `GET /api/summary`, and the dashboard at `/` all share one code path.
  - `prisma/seed.ts`: fake USD and EUR data covering every cycle, a trial, a paused plan, an expired plan, and fees.
  - UI tests render with `react-dom/server` (`tests/render.ts`) and assume the `en-US` locale for currency strings.
  - Verified: `npm run check` (95 tests), `npm run test:coverage`, `next build`, and live `/` and
    `/api/summary` against the seed. Totals matched hand-computed values.

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
