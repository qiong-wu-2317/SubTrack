import { monthlyCostCents, yearlyCostCents } from "@/lib/billing";
import { cents, type Cents } from "@/lib/money";
import { effectiveStatus } from "@/lib/status";
import type { SubscriptionRecord, SubscriptionStatus } from "@/lib/types";

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
  /** Subscription id; names are not unique (AC-3.7). */
  id: string;
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

type SpendBucket = "active" | "trials";

/** A counted subscription with its costs worked out once. */
type Costed = {
  id: string;
  name: string;
  category: string;
  currency: string;
  bucket: SpendBucket;
  monthly: Cents;
  yearly: Cents;
};

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

/** Highest monthly first; ties broken by each key in turn so output is deterministic. */
function byMonthlyThen<T extends { monthlyCents: number }>(...keys: ((item: T) => string)[]) {
  return (a: T, b: T) =>
    b.monthlyCents - a.monthlyCents ||
    keys.reduce((order, key) => order || key(a).localeCompare(key(b)), 0);
}

function groupBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const group = groups.get(k);
    if (group) group.push(item);
    else groups.set(k, [item]);
  }
  return groups;
}

function categoryRows(active: readonly Costed[], totalMonthly: number): CategoryRow[] {
  const rows = [...groupBy(active, (i) => i.category)].map(([category, items]) => ({
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
    .map((i) => ({ id: i.id, name: i.name, monthlyCents: i.monthly, yearlyCents: i.yearly }))
    .sort(
      byMonthlyThen(
        (t) => t.name,
        (t) => t.id,
      ),
    )
    .slice(0, TOP_SUBSCRIPTIONS);
}

function summarizeCurrency(currency: string, items: readonly Costed[]): CurrencySummary {
  const active = items.filter((i) => i.bucket === "active");
  const trials = items.filter((i) => i.bucket === "trials");
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
 * BR-8: only active subscriptions count as spend; trials are reported separately;
 * paused, cancelled and expired are left out.
 */
function spendBucket(status: SubscriptionStatus): SpendBucket | null {
  if (status === "active") return "active";
  if (status === "trial") return "trials";
  return null;
}

function costed(sub: SubscriptionRecord, bucket: SpendBucket): Costed {
  return {
    id: sub.id,
    name: sub.name,
    category: normalizeCategory(sub.category),
    currency: sub.currency,
    bucket,
    monthly: monthlyCostCents(sub),
    yearly: yearlyCostCents(sub),
  };
}

/**
 * US-3: spend per currency as of `now` (BR-5 via effectiveStatus, BR-8 via spendBucket).
 * BR-6: one summary per currency, never summed across currencies.
 */
export function summarizeSpend(
  subscriptions: readonly SubscriptionRecord[],
  now: Date,
): CurrencySummary[] {
  const counted = subscriptions.flatMap((sub) => {
    const bucket = spendBucket(effectiveStatus(sub, now));
    return bucket === null ? [] : [costed(sub, bucket)];
  });

  return [...groupBy(counted, (i) => i.currency)]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, items]) => summarizeCurrency(currency, items));
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
