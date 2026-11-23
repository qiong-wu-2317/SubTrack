import { describe, expect, it } from "vitest";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import type { Cents } from "@/lib/money";
import type { CategoryRow } from "@/lib/summary";
import { count, render } from "../../tests/render";

const c = (n: number) => n as Cents;

function row(category: string, monthly: number, percent: number, rowCount = 1): CategoryRow {
  return {
    category,
    monthlyCents: c(monthly),
    yearlyCents: c(monthly * 12),
    count: rowCount,
    share: percent / 100,
    percent,
  };
}

describe("CategoryBreakdown", () => {
  it("shows an empty message when there is no active spend", () => {
    const { text } = render(<CategoryBreakdown rows={[]} currency="USD" />);
    expect(text).toContain("No active spend yet.");
  });

  it("US-3: shows each category with its monthly spend and percent", () => {
    const { text } = render(
      <CategoryBreakdown rows={[row("fitness", 3780, 64), row("music", 2150, 36)]} currency="USD" />,
    );
    expect(text).toContain("fitness");
    expect(text).toContain("$37.80");
    expect(text).toContain("64%");
    expect(text).toContain("music");
    expect(text).toContain("$21.50");
    expect(text).toContain("36%");
  });

  it("shows how many subscriptions are in each category, singular and plural", () => {
    const { text } = render(
      <CategoryBreakdown rows={[row("software", 3000, 75, 2), row("news", 1000, 25, 1)]} currency="USD" />,
    );
    expect(text).toContain("2 subscriptions");
    expect(text).toContain("1 subscription");
    expect(text).not.toContain("1 subscriptions");
  });

  it("draws one meter per row, valued at the row's percent", () => {
    const { html } = render(
      <CategoryBreakdown rows={[row("fitness", 600, 60), row("music", 400, 40)]} currency="USD" />,
    );
    expect(count(html, 'role="meter"')).toBe(2);
    expect(html).toContain('aria-valuenow="60"');
    expect(html).toContain('aria-valuenow="40"');
  });

  it("US-3: limits the dashboard to 5 rows, rolling the smallest into other", () => {
    const rows = [
      row("a", 600, 30),
      row("b", 500, 25),
      row("c", 400, 20),
      row("d", 300, 15),
      row("e", 120, 6),
      row("f", 80, 4),
    ];
    const { html, text } = render(<CategoryBreakdown rows={rows} currency="USD" />);
    expect(count(html, 'role="meter"')).toBe(5);
    expect(text).toContain("other");
    expect(text).toContain("$2.00"); // e + f = 120 + 80
    expect(text).toContain("10%");
    expect(text).not.toContain("$1.20"); // "e" is not listed on its own
  });

  it("formats amounts in the row's currency", () => {
    const { text } = render(<CategoryBreakdown rows={[row("music", 999, 100)]} currency="EUR" />);
    expect(text).toContain("€9.99");
  });
});
