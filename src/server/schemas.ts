import "server-only";
import { z } from "zod";
import { BILLING_CYCLES, FEE_KINDS, SUBSCRIPTION_STATUSES } from "@/lib/types";

// Built from the domain tuples so Zod and src/lib can never disagree (ADR-6).
export const BillingCycleSchema = z.enum(BILLING_CYCLES);
export const SubscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUSES);
export const FeeKindSchema = z.enum(FEE_KINDS);

/** ISO 4217 code, uppercase (BR-6). */
export const CurrencySchema = z
  .string()
  .regex(/^[A-Z]{3}$/, { error: "currency must be a 3-letter uppercase ISO code" });

export const SummaryQuerySchema = z.object({
  currency: CurrencySchema.optional(),
});
export type SummaryQuery = z.infer<typeof SummaryQuerySchema>;
