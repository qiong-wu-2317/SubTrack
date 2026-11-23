import { describe, expect, expectTypeOf, it } from "vitest";
import type { z } from "zod";
import type { BillingCycle, FeeKind, SubscriptionStatus } from "@/lib/types";
import {
  BillingCycleSchema,
  FeeKindSchema,
  SubscriptionStatusSchema,
  SummaryQuerySchema,
} from "@/server/schemas";

describe("schemas", () => {
  // ADR-6: Zod and the domain types must never drift apart. `npm run typecheck` fails on a mismatch.
  it("ADR-6: Zod enums match the domain types exactly", () => {
    expectTypeOf<z.infer<typeof BillingCycleSchema>>().toEqualTypeOf<BillingCycle>();
    expectTypeOf<z.infer<typeof SubscriptionStatusSchema>>().toEqualTypeOf<SubscriptionStatus>();
    expectTypeOf<z.infer<typeof FeeKindSchema>>().toEqualTypeOf<FeeKind>();
  });

  it("AC-3.4: currency is optional and must be a 3-letter uppercase code", () => {
    expect(SummaryQuerySchema.safeParse({}).success).toBe(true);
    expect(SummaryQuerySchema.safeParse({ currency: "EUR" }).success).toBe(true);
    for (const bad of ["usd", "US", "USDX", "U5D", ""]) {
      expect(SummaryQuerySchema.safeParse({ currency: bad }).success, bad).toBe(false);
    }
  });
});
