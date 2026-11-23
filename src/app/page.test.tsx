import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage, { dynamic } from "@/app/page";
import { getSpendSummary } from "@/server/services/summary";
import { asCents, currencySummary } from "../../tests/fixtures";
import { count, render } from "../../tests/render";

// The page is a thin shell over the service; the service has its own integration test.
vi.mock("@/server/services/summary", () => ({ getSpendSummary: vi.fn() }));
const mockedSummary = vi.mocked(getSpendSummary);

const summary = (currency: string, monthly: number) =>
  currencySummary({ currency, monthlyCents: asCents(monthly), activeCount: 1 });

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

  it("AC-3.8: renders per request so BR-5 always uses today's date", () => {
    expect(dynamic).toBe("force-dynamic");
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
