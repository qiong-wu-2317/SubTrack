import "server-only";
import { summarizeSpend, type CurrencySummary } from "@/lib/summary";
import { listSubscriptionsWithFees } from "@/server/repo/subscriptions";

/** US-3: spend per currency as of `now`, optionally narrowed to one currency (AC-3.4). */
export async function getSpendSummary(input: {
  currency?: string;
  now: Date;
}): Promise<CurrencySummary[]> {
  const { currency, now } = input;
  const subscriptions = await listSubscriptionsWithFees();
  // BR-6: currencies never mix, so narrowing before summarizing gives the same result.
  const relevant =
    currency === undefined ? subscriptions : subscriptions.filter((s) => s.currency === currency);
  return summarizeSpend(relevant, now);
}
