import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/summary/route";
import { getSpendSummary } from "@/server/services/summary";

vi.mock("@/server/services/summary", () => ({ getSpendSummary: vi.fn() }));
const mockedSummary = vi.mocked(getSpendSummary);

const get = (query = "") => GET(new Request(`http://localhost/api/summary${query}`));

describe("GET /api/summary", () => {
  beforeEach(() => {
    mockedSummary.mockReset();
    mockedSummary.mockResolvedValue([]);
  });

  it("returns summaries for all currencies by default", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ summaries: [] });
    expect(mockedSummary).toHaveBeenCalledWith(
      expect.objectContaining({ currency: undefined, now: expect.any(Date) }),
    );
  });

  it("passes a valid currency to the service", async () => {
    await get("?currency=EUR");
    expect(mockedSummary).toHaveBeenCalledWith(expect.objectContaining({ currency: "EUR" }));
  });

  it("rejects a lower-case currency with VALIDATION_ERROR", async () => {
    const res = await get("?currency=usd");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.fields.currency).toMatch(/3-letter/);
    expect(mockedSummary).not.toHaveBeenCalled();
  });

  it("hides internal errors behind a generic 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockedSummary.mockRejectedValue(new Error("db exploded at /secret/path"));
    const res = await get();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: { code: "INTERNAL", message: "Something went wrong" } });
  });
});
