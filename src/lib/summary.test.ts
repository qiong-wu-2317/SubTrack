import { describe, expect, it } from "vitest";
import {
  allocatePercents,
  limitCategoryRows,
  normalizeCategory,
  summarizeSpend,
} from "@/lib/summary";
import type { BillingCycle, Fee, SubscriptionRecord, SubscriptionStatus } from "@/lib/types";
import { asCents, categoryRow } from "../../tests/fixtures";

const NOW = new Date("2026-03-15T12:00:00Z");

let seq = 0;
function sub(overrides: {
  id?: string;
  name?: string;
  amount: number;
  currency?: string;
  category?: string;
  billingCycle?: BillingCycle;
  intervalDays?: number | null;
  status?: SubscriptionStatus;
  autoRenew?: boolean;
  endDate?: Date | null;
  fees?: Fee[];
}): SubscriptionRecord {
  seq += 1;
  return {
    id: overrides.id ?? `s${seq}`,
    name: overrides.name ?? `Sub ${seq}`,
    amountCents: asCents(overrides.amount),
    currency: overrides.currency ?? "USD",
    category: overrides.category ?? "streaming",
    billingCycle: overrides.billingCycle ?? "monthly",
    intervalDays: overrides.intervalDays ?? null,
    status: overrides.status ?? "active",
    autoRenew: overrides.autoRenew ?? true,
    endDate: overrides.endDate ?? null,
    fees: overrides.fees ?? [],
  };
}

function only<T>(items: readonly T[]): T {
  expect(items).toHaveLength(1);
  return items[0] as T;
}

describe("summarizeSpend", () => {
  it("returns no summaries when there are no subscriptions", () => {
    expect(summarizeSpend([], NOW)).toEqual([]);
  });

  it("totals monthly and yearly spend for one currency", () => {
    const usd = only(
      summarizeSpend(
        [
          sub({ amount: 1599, billingCycle: "monthly" }),
          sub({ amount: 9999, billingCycle: "yearly", category: "cloud" }),
        ],
        NOW,
      ),
    );
    expect(usd.currency).toBe("USD");
    expect(usd.monthlyCents).toBe(1599 + 833);
    expect(usd.yearlyCents).toBe(19188 + 9999);
    expect(usd.activeCount).toBe(2);
  });

  it("BR-6: never sums across currencies", () => {
    const summaries = summarizeSpend(
      [
        sub({ amount: 1000, currency: "USD" }),
        sub({ amount: 2000, currency: "EUR" }),
        sub({ amount: 500, currency: "USD" }),
      ],
      NOW,
    );
    expect(summaries.map((s) => [s.currency, s.monthlyCents])).toEqual([
      ["EUR", 2000],
      ["USD", 1500],
    ]);
  });

  it("BR-8: paused, cancelled and expired subscriptions are excluded", () => {
    const usd = only(
      summarizeSpend(
        [
          sub({ amount: 1000 }),
          sub({ amount: 5000, status: "paused" }),
          sub({ amount: 5000, status: "cancelled" }),
          sub({ amount: 5000, status: "expired" }),
        ],
        NOW,
      ),
    );
    expect(usd.monthlyCents).toBe(1000);
    expect(usd.activeCount).toBe(1);
  });

  it("BR-8: trials are reported separately with their post-trial cost", () => {
    const usd = only(
      summarizeSpend(
        [
          sub({ amount: 1000 }),
          sub({ amount: 799, status: "trial" }),
          sub({ amount: 12000, status: "trial", billingCycle: "yearly" }),
        ],
        NOW,
      ),
    );
    expect(usd.monthlyCents).toBe(1000);
    expect(usd.activeCount).toBe(1);
    expect(usd.trials).toEqual({ count: 2, monthlyCentsAfterTrial: 799 + 1000 });
  });

  it("BR-8: a currency with only trials still gets a summary", () => {
    const eur = only(summarizeSpend([sub({ amount: 799, currency: "EUR", status: "trial" })], NOW));
    expect(eur.monthlyCents).toBe(0);
    expect(eur.yearlyCents).toBe(0);
    expect(eur.byCategory).toEqual([]);
    expect(eur.topSubscriptions).toEqual([]);
    expect(eur.trials.count).toBe(1);
  });

  it("BR-8: a currency with only excluded subscriptions gets no summary", () => {
    expect(summarizeSpend([sub({ amount: 1000, status: "paused" })], NOW)).toEqual([]);
  });

  it("BR-5: an active plan past its non-renewing end date counts as expired", () => {
    const summaries = summarizeSpend(
      [sub({ amount: 1000, autoRenew: false, endDate: new Date("2026-03-01T00:00:00Z") })],
      NOW,
    );
    expect(summaries).toEqual([]);
  });

  it("BR-9: recurring fees count, one-time fees do not", () => {
    const usd = only(
      summarizeSpend(
        [
          sub({
            amount: 1000,
            fees: [
              { kind: "tax", amountCents: asCents(80), recurring: true },
              { kind: "setup", amountCents: asCents(2500), recurring: false },
            ],
          }),
        ],
        NOW,
      ),
    );
    expect(usd.monthlyCents).toBe(1080);
    expect(usd.yearlyCents).toBe(12960);
  });

  it("BR-10: yearly total is the sum of per-cycle yearly costs, not monthly × 12", () => {
    const usd = only(summarizeSpend([sub({ amount: 1000, billingCycle: "weekly" })], NOW));
    expect(usd.monthlyCents).toBe(4333);
    expect(usd.yearlyCents).toBe(52000);
  });

  it("groups by normalized category, sorted by monthly spend", () => {
    const usd = only(
      summarizeSpend(
        [
          sub({ amount: 1000, category: "Streaming" }),
          sub({ amount: 500, category: "  streaming " }),
          sub({ amount: 3780, category: "Fitness" }),
          sub({ amount: 200, category: "" }),
        ],
        NOW,
      ),
    );
    expect(usd.byCategory.map((r) => [r.category, r.monthlyCents, r.count])).toEqual([
      ["fitness", 3780, 1],
      ["streaming", 1500, 2],
      ["other", 200, 1],
    ]);
  });

  it("category rows carry yearly spend, exact share and whole percents summing to 100", () => {
    const usd = only(
      summarizeSpend(
        [
          sub({ amount: 100, category: "a" }),
          sub({ amount: 100, category: "b" }),
          sub({ amount: 100, category: "c" }),
        ],
        NOW,
      ),
    );
    const rows = usd.byCategory;
    expect(rows.map((r) => r.yearlyCents)).toEqual([1200, 1200, 1200]);
    expect(rows.map((r) => r.share)).toEqual([1 / 3, 1 / 3, 1 / 3]);
    expect(rows.map((r) => r.percent)).toEqual([34, 33, 33]);
  });

  it("category monthly totals add up to the currency total", () => {
    const usd = only(
      summarizeSpend(
        [
          sub({ amount: 1000, billingCycle: "weekly", category: "a" }),
          sub({ amount: 1000, billingCycle: "quarterly", category: "b" }),
          sub({ amount: 700, billingCycle: "custom", intervalDays: 14, category: "c" }),
        ],
        NOW,
      ),
    );
    const sum = usd.byCategory.reduce((t, r) => t + r.monthlyCents, 0);
    expect(sum).toBe(usd.monthlyCents);
  });

  it("AC-3.2: category yearly totals add up to the currency's per-cycle yearly total", () => {
    const usd = only(
      summarizeSpend(
        [
          sub({ amount: 1000, billingCycle: "weekly", category: "a" }),
          sub({ amount: 1000, billingCycle: "quarterly", category: "b" }),
          sub({ amount: 700, billingCycle: "custom", intervalDays: 14, category: "c" }),
        ],
        NOW,
      ),
    );
    // BR-10: 52000 + 4000 + 18250, not the sum of monthly amounts × 12 (= 74244)
    expect(usd.yearlyCents).toBe(74250);
    expect(usd.byCategory.reduce((t, r) => t + r.yearlyCents, 0)).toBe(usd.yearlyCents);
  });

  it("AC-3.5: returns every category; only the dashboard limits rows", () => {
    const categories = ["a", "b", "c", "d", "e", "f", "g"];
    const usd = only(
      summarizeSpend(
        categories.map((category, i) => sub({ amount: 1000 - i * 100, category })),
        NOW,
      ),
    );
    expect(usd.byCategory.map((r) => r.category)).toEqual(categories);
    expect(usd.byCategory.reduce((t, r) => t + r.percent, 0)).toBe(100);
  });

  it("lists the top 3 subscriptions by monthly cost", () => {
    const usd = only(
      summarizeSpend(
        [
          sub({ id: "small", name: "Small", amount: 100 }),
          sub({ id: "gym", name: "Gym", amount: 3780 }),
          sub({ id: "cloud", name: "Cloud", amount: 24000, billingCycle: "yearly" }),
          sub({ id: "music", name: "Music", amount: 1099 }),
          sub({ id: "trial", name: "Trial", amount: 99999, status: "trial" }),
        ],
        NOW,
      ),
    );
    expect(usd.topSubscriptions).toEqual([
      { id: "gym", name: "Gym", monthlyCents: 3780, yearlyCents: 45360 },
      { id: "cloud", name: "Cloud", monthlyCents: 2000, yearlyCents: 24000 },
      { id: "music", name: "Music", monthlyCents: 1099, yearlyCents: 13188 },
    ]);
  });

  it("breaks ties in top subscriptions by name", () => {
    const usd = only(
      summarizeSpend([sub({ name: "Beta", amount: 500 }), sub({ name: "Alpha", amount: 500 })], NOW),
    );
    expect(usd.topSubscriptions.map((t) => t.name)).toEqual(["Alpha", "Beta"]);
  });

  it("AC-3.7: each top entry carries its subscription id, so same-named ones stay distinct", () => {
    const usd = only(
      summarizeSpend(
        [
          sub({ id: "gym-home", name: "Gym", amount: 3000 }),
          sub({ id: "gym-work", name: "Gym", amount: 2000 }),
          sub({ id: "music", name: "Music", amount: 1000 }),
        ],
        NOW,
      ),
    );
    expect(usd.topSubscriptions.map((t) => [t.id, t.name])).toEqual([
      ["gym-home", "Gym"],
      ["gym-work", "Gym"],
      ["music", "Music"],
    ]);
  });

  it("AC-3.7: same name and same cost are ordered by id, independent of input order", () => {
    const a = sub({ id: "a", name: "Gym", amount: 500 });
    const b = sub({ id: "b", name: "Gym", amount: 500 });
    const ids = (subs: SubscriptionRecord[]) =>
      only(summarizeSpend(subs, NOW)).topSubscriptions.map((t) => t.id);
    expect(ids([b, a])).toEqual(["a", "b"]);
    expect(ids([a, b])).toEqual(["a", "b"]);
  });

  it("free subscriptions give zero share and percent instead of dividing by zero", () => {
    const usd = only(summarizeSpend([sub({ amount: 0, category: "free" })], NOW));
    expect(usd.byCategory).toEqual([
      { category: "free", monthlyCents: 0, yearlyCents: 0, count: 1, share: 0, percent: 0 },
    ]);
  });
});

describe("normalizeCategory", () => {
  it("trims and lower-cases", () => {
    expect(normalizeCategory("  Fitness ")).toBe("fitness");
  });

  it("maps blank to other", () => {
    expect(normalizeCategory("   ")).toBe("other");
  });
});

describe("allocatePercents", () => {
  it("returns exact percents when they divide evenly", () => {
    expect(allocatePercents([50, 25, 25])).toEqual([50, 25, 25]);
  });

  it("gives leftover points to the largest remainders", () => {
    // exact: 33.3, 33.3, 33.3 → one extra point to the first
    expect(allocatePercents([1, 1, 1])).toEqual([34, 33, 33]);
    // exact: 66.67, 16.67, 16.67 → 66 + 16 + 16 = 98; the largest remainders get +1 each
    expect(allocatePercents([4, 1, 1])).toEqual([67, 17, 16]);
  });

  it("returns zeros when the total is zero", () => {
    expect(allocatePercents([0, 0])).toEqual([0, 0]);
  });

  it("returns an empty list for no values", () => {
    expect(allocatePercents([])).toEqual([]);
  });
});

describe("limitCategoryRows", () => {
  const row = categoryRow;

  it("returns rows unchanged when within the limit", () => {
    const rows = [row("a", 300, 60), row("b", 200, 40)];
    expect(limitCategoryRows(rows, 5)).toEqual(rows);
  });

  it("rolls the smallest categories into other, keeping limit rows", () => {
    const rows = [
      row("a", 600, 30),
      row("b", 500, 25),
      row("c", 400, 20),
      row("d", 300, 15),
      row("e", 120, 6),
      row("f", 80, 4),
    ];
    const limited = limitCategoryRows(rows, 5);
    expect(limited.map((r) => r.category)).toEqual(["a", "b", "c", "d", "other"]);
    expect(limited[4]).toEqual({
      category: "other",
      monthlyCents: 200,
      yearlyCents: 2400,
      count: 2,
      share: 0.1,
      percent: 10,
    });
    expect(limited.reduce((t, r) => t + r.percent, 0)).toBe(100);
  });

  it("merges an existing other row into the rollup", () => {
    const rows = [
      row("other", 700, 35),
      row("a", 600, 30),
      row("b", 300, 15),
      row("c", 200, 10),
      row("d", 100, 5),
      row("e", 100, 5),
    ];
    const limited = limitCategoryRows(rows, 5);
    expect(limited.map((r) => r.category)).toEqual(["a", "b", "c", "d", "other"]);
    expect(limited[4]?.monthlyCents).toBe(800);
    expect(limited[4]?.count).toBe(2);
    expect(limited[4]?.percent).toBe(40);
  });
});
