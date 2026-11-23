import type { Cents } from "@/lib/money";
import type { CategoryRow, CurrencySummary } from "@/lib/summary";

/**
 * Test data is built with a cast instead of `cents()`, so fixtures never depend on the
 * code under test (a broken `cents` must fail its own tests, not every fixture).
 */
export const asCents = (n: number) => n as Cents;

/** A category row; yearly is monthly × 12 and share mirrors percent. */
export function categoryRow(
  category: string,
  monthly: number,
  percent: number,
  count = 1,
): CategoryRow {
  return {
    category,
    monthlyCents: asCents(monthly),
    yearlyCents: asCents(monthly * 12),
    count,
    share: percent / 100,
    percent,
  };
}

/** An empty USD summary; override what the test cares about. */
export function currencySummary(overrides: Partial<CurrencySummary> = {}): CurrencySummary {
  return {
    currency: "USD",
    monthlyCents: asCents(0),
    yearlyCents: asCents(0),
    activeCount: 0,
    byCategory: [],
    topSubscriptions: [],
    trials: { count: 0, monthlyCentsAfterTrial: asCents(0) },
    ...overrides,
  };
}
