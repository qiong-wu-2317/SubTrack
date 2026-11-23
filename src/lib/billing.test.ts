import { describe, expect, it } from "vitest";
import { monthlyCostCents, yearlyCostCents } from "@/lib/billing";
import type { Billable, BillingCycle, Fee } from "@/lib/types";
import { asCents } from "../../tests/fixtures";

function billable(
  amount: number,
  billingCycle: BillingCycle,
  opts: { intervalDays?: number | null; fees?: Fee[] } = {},
): Billable {
  return {
    amountCents: asCents(amount),
    billingCycle,
    intervalDays: opts.intervalDays ?? null,
    fees: opts.fees ?? [],
  };
}

const fee = (amount: number, recurring: boolean): Fee => ({
  kind: "tax",
  amountCents: asCents(amount),
  recurring,
});

describe("monthlyCostCents", () => {
  it("BR-2: weekly is ×52/12", () => {
    // 1000 × 52 / 12 = 4333.33…
    expect(monthlyCostCents(billable(1000, "weekly"))).toBe(4333);
  });

  it("BR-2: monthly is unchanged", () => {
    expect(monthlyCostCents(billable(1599, "monthly"))).toBe(1599);
  });

  it("BR-2: quarterly is ÷3", () => {
    expect(monthlyCostCents(billable(3000, "quarterly"))).toBe(1000);
    // 1000 / 3 = 333.33…
    expect(monthlyCostCents(billable(1000, "quarterly"))).toBe(333);
  });

  it("BR-2: yearly is ÷12", () => {
    // 9999 / 12 = 833.25
    expect(monthlyCostCents(billable(9999, "yearly"))).toBe(833);
  });

  it("BR-2: custom is ×365/12/intervalDays", () => {
    // 700 × 365 / (12 × 14) = 1520.83…
    expect(monthlyCostCents(billable(700, "custom", { intervalDays: 14 }))).toBe(1521);
  });

  it("BR-2: rounds half up to whole cents", () => {
    // 6 / 12 = 0.5 → 1; 18 / 12 = 1.5 → 2
    expect(monthlyCostCents(billable(6, "yearly"))).toBe(1);
    expect(monthlyCostCents(billable(18, "yearly"))).toBe(2);
  });

  it("BR-2: rounds once at the end, not per component", () => {
    // (1 + 1) × 52 / 12 = 8.67 → 9. Rounding each part first would give 4 + 4 = 8.
    expect(monthlyCostCents(billable(1, "weekly", { fees: [fee(1, true)] }))).toBe(9);
  });

  it("BR-9: includes recurring fees and excludes one-time fees", () => {
    const sub = billable(1000, "monthly", { fees: [fee(200, true), fee(500, false)] });
    expect(monthlyCostCents(sub)).toBe(1200);
  });

  it("BR-9: normalizes recurring fees with the subscription's cycle", () => {
    // (3000 + 300) / 3 = 1100
    const sub = billable(3000, "quarterly", { fees: [fee(300, true)] });
    expect(monthlyCostCents(sub)).toBe(1100);
  });

  it("returns 0 for a free subscription", () => {
    expect(monthlyCostCents(billable(0, "monthly"))).toBe(0);
  });
});

describe("yearlyCostCents", () => {
  it("BR-10: weekly is ×52", () => {
    expect(yearlyCostCents(billable(1000, "weekly"))).toBe(52000);
  });

  it("BR-10: monthly is ×12", () => {
    expect(yearlyCostCents(billable(1599, "monthly"))).toBe(19188);
  });

  it("BR-10: quarterly is ×4", () => {
    expect(yearlyCostCents(billable(1000, "quarterly"))).toBe(4000);
  });

  it("BR-10: yearly is unchanged", () => {
    expect(yearlyCostCents(billable(9999, "yearly"))).toBe(9999);
  });

  it("BR-10: custom is ×365/intervalDays", () => {
    expect(yearlyCostCents(billable(700, "custom", { intervalDays: 14 }))).toBe(18250);
    // 1000 × 365 / 30 = 12166.67
    expect(yearlyCostCents(billable(1000, "custom", { intervalDays: 30 }))).toBe(12167);
  });

  it("BR-10: is not monthly ×12", () => {
    const sub = billable(1000, "weekly");
    expect(yearlyCostCents(sub)).toBe(52000);
    expect(monthlyCostCents(sub) * 12).toBe(51996);
  });

  it("BR-9: includes recurring fees and excludes one-time fees", () => {
    const sub = billable(1000, "monthly", { fees: [fee(200, true), fee(500, false)] });
    expect(yearlyCostCents(sub)).toBe(14400);
  });
});

describe("custom interval validation", () => {
  it("rejects a custom cycle without intervalDays", () => {
    expect(() => monthlyCostCents(billable(700, "custom"))).toThrow(/intervalDays/);
    expect(() => yearlyCostCents(billable(700, "custom"))).toThrow(/intervalDays/);
  });

  it("rejects a non-positive or fractional intervalDays", () => {
    expect(() => monthlyCostCents(billable(700, "custom", { intervalDays: 0 }))).toThrow(/intervalDays/);
    expect(() => monthlyCostCents(billable(700, "custom", { intervalDays: 2.5 }))).toThrow(/intervalDays/);
  });
});
