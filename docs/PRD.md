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
