# SubTrack — Product Requirements (P3)

## Problem
People pay for many subscriptions (streaming, SaaS, gym, cloud, phone, insurance) on
different cycles, cards and currencies. They forget free trials, get surprised by
annual renewals, and cannot answer "how much do I spend per month?"

## Target user
A single individual managing their own subscriptions on their own device. No
multi-tenant accounts in v1.

## Goals
1. One place to record every subscription with price, cycle, fees and payment method.
2. Never miss a renewal, trial end, or expiration.
3. Know true monthly / yearly spend, including fees.

## Non-goals (v1)
- Connecting to banks or card networks, or charging any card. SubTrack **records**
  payments; it never makes them.
- Storing full card numbers, CVV, or bank credentials.
- Multi-user / sharing / family plans splitting.
- Auto-cancelling subscriptions with vendors.

## Core entities
| Entity | Key fields |
|---|---|
| Subscription | name, vendor, category, amount, currency, billing cycle, start date, next renewal, end date (expiration), trial end, auto-renew, status, payment method |
| Payment | subscription, amount, currency, paid at, period start/end |
| Fee | subscription, kind (tax/setup/late/fx/other), amount, recurring? |
| PaymentMethod | label, last 4 digits (optional) |

## User stories (MVP)
- **US-1** As a user, I add a subscription with price, cycle and next renewal date.
- **US-2** I edit, pause, cancel, or delete a subscription.
- **US-3** I see a dashboard: total monthly spend, yearly spend, spend by category.
- **US-4** I see upcoming renewals in the next 7 / 30 days, sorted by date.
- **US-5** I get flagged when a trial ends or a plan expires within `REMINDER_LEAD_DAYS`.
- **US-6** I log a payment; the next renewal date advances by one cycle.
- **US-7** I attach one-time or recurring fees; totals include recurring fees.
- **US-8** I export all data to CSV / JSON.

## Acceptance criteria

### US-3 Spend dashboard
Each criterion lists the tests that verify it.

- **AC-3.1 Monthly total.** For each currency, the monthly total is the sum of each active
  subscription's monthly cost. That cost is its per-cycle amount plus recurring fees, normalized by BR-2
  and rounded once, half up. One-time fees are excluded (BR-9). Category monthly amounts add up to the total.
  *Tests:* `billing.test.ts` (monthlyCostCents), `summary.test.ts` (totals, BR-9, category sum).
- **AC-3.2 Yearly total.** The yearly total is computed per subscription from its cycle (BR-10), never
  monthly × 12. Category yearly amounts add up to the yearly total.
  *Tests:* `billing.test.ts` (yearlyCostCents), `summary.test.ts` (BR-10, yearly category sum).
- **AC-3.3 What counts as spend.** Only `active` subscriptions count (BR-8). Trials are reported
  separately as a count and their monthly cost after the trial. `paused`, `cancelled` and `expired` are
  excluded. A non-renewing plan is excluded from the day after its `endDate` (BR-5).
  *Tests:* `status.test.ts`, `summary.test.ts` (BR-5, BR-8), `services/summary.test.ts` (BR-5).
- **AC-3.4 Currencies.** There is one summary per currency, amounts are never summed across currencies
  (BR-6), and summaries are sorted by currency code. `GET /api/summary?currency=XXX` returns only that
  currency, or an empty list if it has no spend. A malformed code returns 400 `VALIDATION_ERROR` with
  `fields.currency`.
  *Tests:* `summary.test.ts` (BR-6), `services/summary.test.ts` (filter), `route.test.ts`.
- **AC-3.5 Spend by category.** Category names are trimmed and lower-cased, and blank becomes `other`.
  Rows are sorted by monthly spend, highest first, with ties by name. Each row has monthly, yearly, count,
  exact `share`, and a whole `percent`; a currency's percents add up to 100 (all 0 when its total is 0).
  The API returns every category.
  *Tests:* `summary.test.ts` (category rows, allocatePercents, all categories returned).
- **AC-3.6 Dashboard category rows.** The dashboard shows at most 5 rows. The smallest categories, and
  any existing `other`, roll into one trailing `other` row, and percents still add up to 100. Each row
  shows its monthly amount, percent, subscription count and a bar.
  *Tests:* `summary.test.ts` (limitCategoryRows), `CategoryBreakdown.test.tsx`.
- **AC-3.7 Most expensive.** Each currency lists up to 3 active subscriptions with the highest monthly
  cost, ties by name. Subscriptions that share a name are listed separately.
  *Tests:* `summary.test.ts` (top subscriptions), `CurrencySummaryCard.test.tsx`.
- **AC-3.8 Dashboard display.** Each currency gets a card with its monthly and yearly totals, active
  count, and a trials line only when there are trials. Every amount is formatted in that card's
  currency. With no active or trial subscriptions, an empty state is shown. The page and the API are
  rendered per request, so BR-5 always uses today's date.
  *Tests:* `CurrencySummaryCard.test.tsx`, `page.test.tsx`, `route.test.ts`.

## Business rules
- **BR-1** Money is integer minor units (cents). No floating-point arithmetic on money.
- **BR-2** Monthly cost normalization: weekly ×52/12, quarterly ÷3, yearly ÷12, custom ×365/12/intervalDays; round to whole cents at the end.
- **BR-3** Monthly renewal on day 29–31 clamps to the last day of shorter months.
- **BR-4** Status transitions: `trial → active | cancelled`; `active ↔ paused`; `active → cancelled → expired`. `expired` is terminal.
- **BR-5** A subscription with `autoRenew = false` and `endDate` in the past becomes `expired`.
- **BR-6** Totals are only summed within one currency; mixed currencies are shown per currency (no FX conversion in v1).
- **BR-7** Dates are stored in UTC; displayed in the user's local time zone.
- **BR-8** Only `active` subscriptions count as spend. `trial` subscriptions are reported separately (count and cost after the trial); `paused`, `cancelled` and `expired` are excluded.
- **BR-9** Recurring fees are charged once per billing cycle and normalized with the subscription's cycle. One-time fees are excluded from monthly/yearly run-rate totals.
- **BR-10** Yearly spend is computed per subscription from its cycle (weekly ×52, monthly ×12, quarterly ×4, custom ×365/intervalDays), not as monthly ×12.

## Success metrics
- Adding a subscription takes < 30 seconds.
- 100% of business rules BR-1…BR-10 covered by unit tests.
