import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/repo/db";
import { getSpendSummary } from "@/server/services/summary";

const NOW = new Date("2026-03-15T12:00:00Z");
const DAY = (iso: string) => new Date(`${iso}T00:00:00Z`);

async function addSubscription(data: {
  name: string;
  amountCents: number;
  currency: string;
  category: string;
  billingCycle: string;
  intervalDays?: number;
  status?: string;
  autoRenew?: boolean;
  endDate?: Date;
  fees?: { kind: string; amountCents: number; recurring: boolean }[];
}) {
  const { fees, ...rest } = data;
  await db.subscription.create({
    data: {
      ...rest,
      startDate: DAY("2026-01-01"),
      nextRenewalDate: DAY("2026-04-01"),
      ...(fees ? { fees: { create: fees } } : {}),
    },
  });
}

describe("getSpendSummary", () => {
  beforeEach(async () => {
    await db.fee.deleteMany();
    await db.subscription.deleteMany();
  });

  it("returns an empty list with no subscriptions", async () => {
    expect(await getSpendSummary({ now: NOW })).toEqual([]);
  });

  it("summarizes stored subscriptions per currency, with fees", async () => {
    await addSubscription({
      name: "FitClub",
      amountCents: 3500,
      currency: "USD",
      category: "Fitness",
      billingCycle: "monthly",
      fees: [
        { kind: "tax", amountCents: 280, recurring: true },
        { kind: "setup", amountCents: 4900, recurring: false },
      ],
    });
    await addSubscription({
      name: "CloudBox",
      amountCents: 9999,
      currency: "USD",
      category: "cloud",
      billingCycle: "yearly",
    });
    await addSubscription({
      name: "Musik",
      amountCents: 999,
      currency: "EUR",
      category: "music",
      billingCycle: "monthly",
    });
    await addSubscription({
      name: "Paused Gym",
      amountCents: 5000,
      currency: "USD",
      category: "fitness",
      billingCycle: "monthly",
      status: "paused",
    });

    const summaries = await getSpendSummary({ now: NOW });

    expect(summaries.map((s) => s.currency)).toEqual(["EUR", "USD"]);
    const usd = summaries[1];
    // FitClub (3500 + 280) + CloudBox 9999 / 12 = 3780 + 833
    expect(usd?.monthlyCents).toBe(4613);
    expect(usd?.yearlyCents).toBe(45360 + 9999);
    expect(usd?.activeCount).toBe(2);
    expect(usd?.byCategory.map((r) => r.category)).toEqual(["fitness", "cloud"]);
  });

  it("filters to one currency", async () => {
    await addSubscription({
      name: "A",
      amountCents: 100,
      currency: "USD",
      category: "x",
      billingCycle: "monthly",
    });
    await addSubscription({
      name: "B",
      amountCents: 200,
      currency: "EUR",
      category: "x",
      billingCycle: "monthly",
    });

    const summaries = await getSpendSummary({ currency: "EUR", now: NOW });
    expect(summaries.map((s) => [s.currency, s.monthlyCents])).toEqual([["EUR", 200]]);
  });

  it("AC-3.4: filtering to a currency with no spend returns an empty list", async () => {
    await addSubscription({
      name: "A",
      amountCents: 100,
      currency: "USD",
      category: "x",
      billingCycle: "monthly",
    });

    expect(await getSpendSummary({ currency: "GBP", now: NOW })).toEqual([]);
  });

  it("BR-5: applies expiry as of the given now", async () => {
    await addSubscription({
      name: "Ending",
      amountCents: 1000,
      currency: "USD",
      category: "x",
      billingCycle: "monthly",
      autoRenew: false,
      endDate: DAY("2026-03-20"),
    });

    expect(await getSpendSummary({ now: NOW })).toHaveLength(1);
    expect(await getSpendSummary({ now: DAY("2026-03-21") })).toEqual([]);
  });

  it("rejects an unknown status stored in the database", async () => {
    await addSubscription({
      name: "Bad",
      amountCents: 100,
      currency: "USD",
      category: "x",
      billingCycle: "monthly",
      status: "frozen",
    });
    await expect(getSpendSummary({ now: NOW })).rejects.toThrow(/status/);
  });
});
