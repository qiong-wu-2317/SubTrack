import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { formatCents } from "@/lib/money";
import type { CurrencySummary } from "@/lib/summary";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export function CurrencySummaryCard({ summary }: { summary: CurrencySummary }) {
  const { currency, trials } = summary;
  const money = (amount: CurrencySummary["monthlyCents"]) => formatCents(amount, currency);

  return (
    <section
      aria-labelledby={`summary-${currency}`}
      className="rounded-xl border border-neutral-200 p-6 dark:border-neutral-800"
    >
      <header className="flex items-baseline justify-between">
        <h2 id={`summary-${currency}`} className="text-lg font-semibold">
          {currency}
        </h2>
        <span className="text-sm text-neutral-500">{summary.activeCount} active</span>
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-4">
        <Stat label="Monthly" value={money(summary.monthlyCents)} />
        <Stat label="Yearly" value={money(summary.yearlyCents)} />
      </dl>

      {/* BR-8: trials don't count as spend; show what they'll add once they convert. */}
      {trials.count > 0 && (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
          {trials.count} {trials.count === 1 ? "trial" : "trials"}: adds{" "}
          {money(trials.monthlyCentsAfterTrial)}/mo once they convert
        </p>
      )}

      <h3 className="mt-6 mb-3 text-sm font-medium">By category</h3>
      <CategoryBreakdown rows={summary.byCategory} currency={currency} />

      {summary.topSubscriptions.length > 0 && (
        <>
          <h3 className="mt-6 mb-2 text-sm font-medium">Most expensive</h3>
          <ol className="space-y-1 text-sm">
            {summary.topSubscriptions.map((top) => (
              <li key={top.name} className="flex justify-between gap-4">
                <span>{top.name}</span>
                <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
                  {money(top.monthlyCents)}/mo
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
