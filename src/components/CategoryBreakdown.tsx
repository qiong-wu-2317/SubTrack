import { formatCents } from "@/lib/money";
import { limitCategoryRows, type CategoryRow } from "@/lib/summary";

/** API.md: the dashboard shows at most 5 rows; the API returns every category. */
const DASHBOARD_ROWS = 5;

export function CategoryBreakdown({
  rows,
  currency,
}: {
  rows: readonly CategoryRow[];
  currency: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-neutral-500">No active spend yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {limitCategoryRows(rows, DASHBOARD_ROWS).map((row) => (
        <li key={row.category}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="capitalize">
              {row.category}
              <span className="ml-2 text-xs text-neutral-500">
                {row.count} {row.count === 1 ? "subscription" : "subscriptions"}
              </span>
            </span>
            <span className="tabular-nums">
              {formatCents(row.monthlyCents, currency)}
              <span className="ml-2 inline-block w-10 text-right text-xs text-neutral-500">
                {row.percent}%
              </span>
            </span>
          </div>
          <div
            role="meter"
            aria-label={`${row.category} share of monthly spend`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={row.percent}
            className="mt-1 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800"
          >
            <div
              className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500"
              style={{ width: `${row.percent}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
