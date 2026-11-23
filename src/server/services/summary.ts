import "server-only";
import { summarizeSpend, type CurrencySummary } from "@/lib/summary";
import { listSubscriptionsWithFees } from "@/server/repo/subscriptions";

/** US-3: spend per currency as of `now`, optionally narrowed to one currency. */
export async function getSpendSummary(input: {
  currency?: string;
  now: Date;
}): Promise<CurrencySummary[]> {
  const summaries = summarizeSpend(await listSubscriptionsWithFees(), input.now);
  if (input.currency === undefined) return summaries;
  return summaries.filter((s) => s.currency === input.currency);
}
