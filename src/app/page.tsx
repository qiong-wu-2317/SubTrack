import { CurrencySummaryCard } from "@/components/CurrencySummaryCard";
import { getSpendSummary } from "@/server/services/summary";

// Spend depends on today's date (BR-5), so render on every request.
export const dynamic = "force-dynamic";

/** US-3: monthly and yearly spend, by category, one card per currency (BR-6). */
export default async function DashboardPage() {
  // `now` is taken here at the edge; domain code always receives it as a parameter.
  const summaries = await getSpendSummary({ now: new Date() });

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8">
      <h1 className="text-2xl font-semibold">SubTrack</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Active subscriptions only. Each currency is totalled separately.
      </p>

      {summaries.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
          No active subscriptions yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {summaries.map((summary) => (
            <CurrencySummaryCard key={summary.currency} summary={summary} />
          ))}
        </div>
      )}
    </main>
  );
}
