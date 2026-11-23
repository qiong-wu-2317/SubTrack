import { describe, expect, it } from "vitest";
import { BILLING_CYCLES, FEE_KINDS, SUBSCRIPTION_STATUSES } from "@/lib/types";

// These lists are the allowed DB string values (ADR-6). Changing them needs a data migration.
describe("domain value lists", () => {
  it("BR-2: billing cycles match the normalization rule", () => {
    expect(BILLING_CYCLES).toEqual(["weekly", "monthly", "quarterly", "yearly", "custom"]);
  });

  it("BR-4: statuses match the transition rule", () => {
    expect(SUBSCRIPTION_STATUSES).toEqual(["trial", "active", "paused", "cancelled", "expired"]);
  });

  it("fee kinds match the PRD Fee entity", () => {
    expect(FEE_KINDS).toEqual(["tax", "setup", "late", "fx", "other"]);
  });
});
