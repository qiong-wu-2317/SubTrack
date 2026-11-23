import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/page";
import type { Cents } from "@/lib/money";
import type { CurrencySummary } from "@/lib/summary";
import { getSpendSummary } from "@/server/services/summary";
import { count, render } from "../../tests/render";

// The page is a thin shell over the service; the service has its own integration test.
vi.mock("@/server/services/summary", () => ({ getSpendSummary: vi.fn() }));
const mockedSummary = vi.mocked(getSpendSummary);

const c = (n: number) => n as Cents;

function summary(currency: string, monthly: number): CurrencySummary {
  return {
    currency,
    monthlyCents: c(monthly),
    yearlyCents: c(monthly * 12),
    activeCount: 1,
    byCategory: [],
    topSubscriptions: [],
    trials: { count: 0, monthlyCentsAfterTrial: c(0) },
  };
}

async function renderPage() {
  return render(await DashboardPage());
}

describe("dashboard page", () => {
  beforeEach(() => {
    mockedSummary.mockReset();
  });

  it("US-3: asks the service for every currency as of the request time", async () => {
    mockedSummary.mockResolvedValue([]);
    await renderPage();
    expect(mockedSummary).toHaveBeenCalledTimes(1);
    const input = mockedSummary.mock.calls[0]?.[0];
    expect(input?.now).toBeInstanceOf(Date);
    expect(input?.currency).toBeUndefined();
  });

  it("shows an empty state when there are no active subscriptions", async () => {
    mockedSummary.mockResolvedValue([]);
    const { text } = await renderPage();
    expect(text).toContain("No active subscriptions yet.");
  });

  it("BR-6: renders one card per currency, in the service's order", async () => {
    mockedSummary.mockResolvedValue([summary("EUR", 1999), summary("USD", 12366)]);
    const { html, text } = await renderPage();
    expect(count(html, "<section")).toBe(2);
    expect(text.indexOf("EUR")).toBeLessThan(text.indexOf("USD"));
    expect(text).toContain("€19.99");
    expect(text).toContain("$123.66");
    expect(text).not.toContain("No active subscriptions yet.");
  });
});
