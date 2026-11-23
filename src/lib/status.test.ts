import { describe, expect, it } from "vitest";
import { effectiveStatus } from "@/lib/status";
import type { SubscriptionStatus } from "@/lib/types";

const NOW = new Date("2026-03-15T12:00:00Z");

function sub(status: SubscriptionStatus, autoRenew: boolean, endDate: string | null) {
  return { status, autoRenew, endDate: endDate === null ? null : new Date(endDate) };
}

describe("effectiveStatus", () => {
  it("BR-5: non-renewing active subscription past its end date is expired", () => {
    expect(effectiveStatus(sub("active", false, "2026-03-14T00:00:00Z"), NOW)).toBe("expired");
  });

  it("BR-5: cancelled subscription past its end date is expired", () => {
    expect(effectiveStatus(sub("cancelled", false, "2026-01-01T00:00:00Z"), NOW)).toBe("expired");
  });

  it("BR-5: still active on the end date itself", () => {
    expect(effectiveStatus(sub("active", false, "2026-03-15T00:00:00Z"), NOW)).toBe("active");
  });

  it("BR-5: still active before the end date", () => {
    expect(effectiveStatus(sub("active", false, "2026-04-01T00:00:00Z"), NOW)).toBe("active");
  });

  it("BR-5: auto-renewing subscription does not expire", () => {
    expect(effectiveStatus(sub("active", true, "2026-01-01T00:00:00Z"), NOW)).toBe("active");
  });

  it("BR-5: no end date means no expiry", () => {
    expect(effectiveStatus(sub("active", false, null), NOW)).toBe("active");
  });

  it("BR-4: trial and paused never jump straight to expired", () => {
    expect(effectiveStatus(sub("trial", false, "2026-01-01T00:00:00Z"), NOW)).toBe("trial");
    expect(effectiveStatus(sub("paused", false, "2026-01-01T00:00:00Z"), NOW)).toBe("paused");
  });

  it("BR-4: expired is terminal", () => {
    expect(effectiveStatus(sub("expired", true, null), NOW)).toBe("expired");
  });
});
