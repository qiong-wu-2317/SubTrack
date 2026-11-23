import type { Cents } from "@/lib/money";

// Value lists live here (pure domain) so src/lib never imports src/server.
// src/server/schemas.ts builds its Zod enums from these tuples (ADR-6).
export const BILLING_CYCLES = ["weekly", "monthly", "quarterly", "yearly", "custom"] as const;
export const SUBSCRIPTION_STATUSES = ["trial", "active", "paused", "cancelled", "expired"] as const;
export const FEE_KINDS = ["tax", "setup", "late", "fx", "other"] as const;

export type BillingCycle = (typeof BILLING_CYCLES)[number];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export type FeeKind = (typeof FEE_KINDS)[number];

export type Fee = {
  kind: FeeKind;
  amountCents: Cents;
  recurring: boolean;
};

/** The billing-relevant shape of a subscription. Amounts are per billing cycle. */
export type Billable = {
  amountCents: Cents;
  billingCycle: BillingCycle;
  /** Required when billingCycle is "custom". */
  intervalDays: number | null;
  fees: readonly Fee[];
};

export type SubscriptionRecord = Billable & {
  id: string;
  name: string;
  category: string;
  currency: string;
  status: SubscriptionStatus;
  autoRenew: boolean;
  endDate: Date | null;
};
