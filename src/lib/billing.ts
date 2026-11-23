// RED: stub. Implement against src/lib/billing.test.ts.
import type { Cents } from "@/lib/money";
import type { Billable } from "@/lib/types";

export function monthlyCostCents(_sub: Billable): Cents {
  throw new Error("Not implemented: monthlyCostCents");
}

export function yearlyCostCents(_sub: Billable): Cents {
  throw new Error("Not implemented: yearlyCostCents");
}
