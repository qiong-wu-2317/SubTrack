import { monthlyCostCents, yearlyCostCents } from "@/lib/billing";
import { cents, type Cents } from "@/lib/money";
import { effectiveStatus } from "@/lib/status";
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

const OTHER = "other";
const TOP_SUBSCRIPTIONS = 3;

type Costed = { name: string; category: string; monthly: Cents; yearly: Cents };

export function normalizeCategory(raw: string): string {
  const name = raw.trim().toLowerCase();
  return name === "" ? OTHER : name;
}

/**
 * Whole percents that add up to exactly 100 (largest-remainder method).
 * Ties go to the earlier value, so pass values already in display order.
 */
export function allocatePercents(values: readonly number[]): number[] {
  const total = values.reduce((t, v) => t + v, 0);
  if (total === 0) return values.map(() => 0);

  const floors = values.map((v) => Math.floor((v * 100) / total));
  const order = values
    .map((v, index) => ({ index, remainder: (v * 100) % total }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  let leftover = 100 - floors.reduce((t, f) => t + f, 0);
  for (const { index } of order) {
    if (leftover === 0) break;
    floors[index] = (floors[index] ?? 0) + 1;
    leftover -= 1;
  }
  return floors;
}

function sum(values: readonly number[]): Cents {
  return cents(values.reduce((t, v) => t + v, 0));
}

function shareOf(part: number, total: number): number {
  return total === 0 ? 0 : part / total;
}

/** Highest monthly first; ties broken alphabetically by `key` so output is stable. */
function byMonthlyThen<T extends { monthlyCents: number }>(key: (item: T) => string) {
  return (a: T, b: T) => b.monthlyCents - a.monthlyCents || key(a).localeCompare(key(b));
}

function categoryRows(active: readonly Costed[], totalMonthly: number): CategoryRow[] {
  const groups = new Map<string, Costed[]>();
  for (const item of active) {
    const group = groups.get(item.category) ?? [];
    group.push(item);
    groups.set(item.category, group);
  }

  const rows = [...groups].map(([category, items]) => ({
    category,
    monthlyCents: sum(items.map((i) => i.monthly)),
    yearlyCents: sum(items.map((i) => i.yearly)),
    count: items.length,
  }));
  rows.sort(byMonthlyThen((r) => r.category));

  const percents = allocatePercents(rows.map((r) => r.monthlyCents));
  return rows.map((row, i) => ({
    ...row,
    share: shareOf(row.monthlyCents, totalMonthly),
    percent: percents[i] ?? 0,
  }));
}

function topSubscriptions(active: readonly Costed[]): TopSubscription[] {
  return active
    .map((i) => ({ name: i.name, monthlyCents: i.monthly, yearlyCents: i.yearly }))
    .sort(byMonthlyThen((t) => t.name))
    .slice(0, TOP_SUBSCRIPTIONS);
}

function summarizeCurrency(currency: string, active: Costed[], trials: Costed[]): CurrencySummary {
  const monthlyCents = sum(active.map((i) => i.monthly));
  return {
    currency,
    monthlyCents,
    yearlyCents: sum(active.map((i) => i.yearly)),
    activeCount: active.length,
    byCategory: categoryRows(active, monthlyCents),
    topSubscriptions: topSubscriptions(active),
    trials: { count: trials.length, monthlyCentsAfterTrial: sum(trials.map((i) => i.monthly)) },
  };
}

/**
 * US-3: spend per currency as of `now`.
 * BR-6: one summary per currency, never summed across currencies.
 * BR-8: only active subscriptions count as spend; trials are reported separately.
 */
export function summarizeSpend(
  subscriptions: readonly SubscriptionRecord[],
  now: Date,
): CurrencySummary[] {
  const byCurrency = new Map<string, { active: Costed[]; trials: Costed[] }>();

  for (const sub of subscriptions) {
    const status = effectiveStatus(sub, now);
    if (status !== "active" && status !== "trial") continue;

    const bucket = byCurrency.get(sub.currency) ?? { active: [], trials: [] };
    (status === "active" ? bucket.active : bucket.trials).push({
      name: sub.name,
      category: normalizeCategory(sub.category),
      monthly: monthlyCostCents(sub),
      yearly: yearlyCostCents(sub),
    });
    byCurrency.set(sub.currency, bucket);
  }

  return [...byCurrency]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, { active, trials }]) => summarizeCurrency(currency, active, trials));
}

/**
 * Keep the `limit - 1` biggest named categories and roll the rest, including any existing
 * "other" row, into one trailing "other" row. Percents still add up to 100.
 */
export function limitCategoryRows(rows: readonly CategoryRow[], limit: number): CategoryRow[] {
  if (rows.length <= limit) return [...rows];

  const named = rows.filter((r) => r.category !== OTHER);
  const kept = named.slice(0, limit - 1);
  const rest = [...named.slice(limit - 1), ...rows.filter((r) => r.category === OTHER)];

  const monthlyCents = sum(rest.map((r) => r.monthlyCents));
  const other: CategoryRow = {
    category: OTHER,
    monthlyCents,
    yearlyCents: sum(rest.map((r) => r.yearlyCents)),
    count: rest.reduce((t, r) => t + r.count, 0),
    share: shareOf(monthlyCents, sum(rows.map((r) => r.monthlyCents))),
    percent: rest.reduce((t, r) => t + r.percent, 0),
  };
  return [...kept, other];
}
