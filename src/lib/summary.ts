// RED: stub. Implement against src/lib/summary.test.ts.
import type { Cents } from "@/lib/money";
import type { SubscriptionRecord } from "@/lib/types";

export type CategoryRow = {
  category: string;
  monthlyCents: Cents;
  yearlyCents: Cents;
  count: number;
  /** Exact fraction of the currency's monthly spend. A ratio, not money. */
  share: number;
  /** Whole-number percent; a currency's rows add up to 100. */
  percent: number;
};

export type TopSubscription = {
  name: string;
  monthlyCents: Cents;
  yearlyCents: Cents;
};

export type CurrencySummary = {
  currency: string;
  monthlyCents: Cents;
  yearlyCents: Cents;
  activeCount: number;
  byCategory: CategoryRow[];
  topSubscriptions: TopSubscription[];
  trials: { count: number; monthlyCentsAfterTrial: Cents };
};

export function normalizeCategory(_raw: string): string {
  throw new Error("Not implemented: normalizeCategory");
}

export function allocatePercents(_values: readonly number[]): number[] {
  throw new Error("Not implemented: allocatePercents");
}

export function summarizeSpend(
  _subscriptions: readonly SubscriptionRecord[],
  _now: Date,
): CurrencySummary[] {
  throw new Error("Not implemented: summarizeSpend");
}

export function limitCategoryRows(_rows: readonly CategoryRow[], _limit: number): CategoryRow[] {
  throw new Error("Not implemented: limitCategoryRows");
}
