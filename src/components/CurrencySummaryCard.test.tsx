import { describe, expect, it } from "vitest";
import { CurrencySummaryCard } from "@/components/CurrencySummaryCard";
import type { CurrencySummary } from "@/lib/summary";
import { asCents as c, categoryRow, currencySummary } from "../../tests/fixtures";
import { duplicateKeys, render } from "../../tests/render";

/** A populated USD card; tests override what they check. */
function summary(overrides: Partial<CurrencySummary> = {}): CurrencySummary {
  return currencySummary({
    monthlyCents: c(12366),
    yearlyCents: c(148389),
    activeCount: 7,
    byCategory: [categoryRow("fitness", 3780, 100)],
    topSubscriptions: [
      { id: "fitclub", name: "FitClub", monthlyCents: c(3780), yearlyCents: c(45360) },
      { id: "phoneplan", name: "PhonePlan", monthlyCents: c(2150), yearlyCents: c(25800) },
    ],
    ...overrides,
  });
}

describe("CurrencySummaryCard", () => {

  it("US-3: shows the currency with its monthly and yearly totals", () => {
    const { text } = render(<CurrencySummaryCard summary={summary()} />);
    expect(text).toContain("USD");
    expect(text).toMatch(/Monthly \$123\.66/);
    expect(text).toMatch(/Yearly \$1,483\.89/);
  });

  it("shows how many subscriptions are active", () => {
    const { text } = render(<CurrencySummaryCard summary={summary()} />);
    expect(text).toContain("7 active");
  });

  it("US-3: includes the spend-by-category breakdown", () => {
    const { text } = render(<CurrencySummaryCard summary={summary()} />);
    expect(text).toContain("By category");
    expect(text).toContain("fitness");
    expect(text).toContain("100%");
  });

  it("lists the most expensive subscriptions per month", () => {
    const { text } = render(<CurrencySummaryCard summary={summary()} />);
    expect(text).toMatch(/Most expensive FitClub \$37\.80\/mo PhonePlan \$21\.50\/mo/);
  });

  it("omits the most-expensive list when nothing is active", () => {
    const { text } = render(
      <CurrencySummaryCard summary={summary({ topSubscriptions: [], byCategory: [], activeCount: 0 })} />,
    );
    expect(text).toContain("0 active");
    expect(text).not.toContain("Most expensive");
  });

  it("AC-3.7: lists same-named subscriptions separately, keyed by id", () => {
    const sameName = summary({
      topSubscriptions: [
        { id: "gym-home", name: "Gym", monthlyCents: c(3000), yearlyCents: c(36000) },
        { id: "gym-work", name: "Gym", monthlyCents: c(2000), yearlyCents: c(24000) },
      ],
    });
    expect(render(<CurrencySummaryCard summary={sameName} />).text).toMatch(
      /Gym \$30\.00\/mo Gym \$20\.00\/mo/,
    );
    expect(duplicateKeys(CurrencySummaryCard({ summary: sameName }))).toEqual([]);
  });

  it("BR-8: reports trials separately with their cost after the trial", () => {
    const { text } = render(
      <CurrencySummaryCard summary={summary({ trials: { count: 1, monthlyCentsAfterTrial: c(2999) } })} />,
    );
    expect(text).toContain("1 trial");
    expect(text).not.toContain("1 trials");
    expect(text).toContain("$29.99/mo");
  });

  it("BR-8: pluralizes trials", () => {
    const { text } = render(
      <CurrencySummaryCard summary={summary({ trials: { count: 2, monthlyCentsAfterTrial: c(4498) } })} />,
    );
    expect(text).toContain("2 trials");
    expect(text).toContain("$44.98/mo");
  });

  it("BR-8: hides the trials line when there are no trials", () => {
    const { text } = render(<CurrencySummaryCard summary={summary()} />);
    expect(text).toContain("USD"); // the card rendered…
    expect(text).not.toMatch(/trial/i); // …without a trials line
  });

  it("BR-6: formats every amount in the card's own currency", () => {
    const eur = summary({
      currency: "EUR",
      monthlyCents: c(1999),
      yearlyCents: c(23988),
      byCategory: [],
      topSubscriptions: [{ id: "musik", name: "Musik Plus", monthlyCents: c(999), yearlyCents: c(11988) }],
    });
    const { text } = render(<CurrencySummaryCard summary={eur} />);
    expect(text).toMatch(/Monthly €19\.99/);
    expect(text).toMatch(/Yearly €239\.88/);
    expect(text).toContain("€9.99/mo");
    expect(text).not.toContain("$");
  });
});
