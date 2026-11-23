// RED: stub. Implement against src/lib/status.test.ts.
import type { SubscriptionStatus } from "@/lib/types";

type StatusInput = {
  status: SubscriptionStatus;
  autoRenew: boolean;
  endDate: Date | null;
};

export function effectiveStatus(_sub: StatusInput, _now: Date): SubscriptionStatus {
  throw new Error("Not implemented: effectiveStatus");
}
