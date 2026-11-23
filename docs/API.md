# SubTrack — API & Server Actions

All inputs are validated with Zod schemas in `src/server/schemas.ts`. Money fields are
integer cents. Dates are ISO-8601 strings in UTC.

## Server Actions
| Action | Input | Effect |
|---|---|---|
| `createSubscription` | `SubscriptionInput` | Insert; compute `nextRenewal` if omitted |
| `updateSubscription` | `id`, partial `SubscriptionInput` | Update; enforce BR-4 status transitions |
| `deleteSubscription` | `id` | Hard delete (cascades payments and fees) — UI must confirm |
| `logPayment` | `subscriptionId`, `amountCents`, `paidAt` | Insert Payment; advance `nextRenewal` one cycle |
| `addFee` | `subscriptionId`, `kind`, `amountCents`, `recurring` | Insert Fee |

## REST routes
| Method | Path | Returns |
|---|---|---|
| GET | `/api/subscriptions` | `Subscription[]` with fees |
| GET | `/api/summary?currency=USD` | `{ summaries: CurrencySummary[] }`, see below |
| GET | `/api/upcoming?days=30` | Renewals, trial ends and expirations within N days |
| GET | `/api/export?format=csv\|json` | File download |

## `GET /api/summary`
`currency` is optional (3-letter uppercase ISO code). Without it you get one summary per currency (BR-6).
```json
{
  "summaries": [{
    "currency": "USD",
    "monthlyCents": 10207,
    "yearlyCents": 122483,
    "activeCount": 6,
    "byCategory": [{ "category": "fitness", "monthlyCents": 3780, "yearlyCents": 45360, "count": 1, "share": 0.37, "percent": 37 }],
    "topSubscriptions": [{ "name": "FitClub", "monthlyCents": 3780, "yearlyCents": 45360 }],
    "trials": { "count": 1, "monthlyCentsAfterTrial": 799 }
  }]
}
```
`byCategory` is sorted by `monthlyCents`, highest first. `share` is the exact fraction of that currency's monthly spend;
`percent` is a whole number, and a currency's rows always add up to 100. Category names are normalized: trimmed,
lower-cased, and `other` when blank. `topSubscriptions` lists the 3 most expensive active subscriptions.
The dashboard limits the breakdown to 5 rows (smaller categories roll into `other`). The API returns every category.
An invalid `currency` returns 400 `VALIDATION_ERROR` with `fields.currency`.

## Error shape
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "amountCents must be an integer", "fields": { "amountCents": "..." } } }
```
Codes: `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `INVALID_TRANSITION` (409), `INTERNAL` (500).
