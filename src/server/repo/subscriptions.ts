import "server-only";
import type { Fee as FeeRow, Subscription as SubscriptionRow } from "@prisma/client";
import { cents } from "@/lib/money";
import {
  BILLING_CYCLES,
  FEE_KINDS,
  SUBSCRIPTION_STATUSES,
  type Fee,
  type SubscriptionRecord,
} from "@/lib/types";
import { db } from "@/server/repo/db";

// ADR-6: the DB stores plain strings. A value outside the domain list is bad data;
// fail loudly rather than silently miscounting spend.
function oneOf<T extends string>(allowed: readonly T[], value: string, field: string): T {
  const match = allowed.find((v) => v === value);
  if (match === undefined) throw new Error(`Unexpected ${field} in database: "${value}"`);
  return match;
}

function toFee(row: FeeRow): Fee {
  return {
    kind: oneOf(FEE_KINDS, row.kind, "fee kind"),
    amountCents: cents(row.amountCents),
    recurring: row.recurring,
  };
}

function toRecord(row: SubscriptionRow & { fees: FeeRow[] }): SubscriptionRecord {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    currency: row.currency,
    amountCents: cents(row.amountCents),
    billingCycle: oneOf(BILLING_CYCLES, row.billingCycle, "billingCycle"),
    intervalDays: row.intervalDays,
    status: oneOf(SUBSCRIPTION_STATUSES, row.status, "status"),
    autoRenew: row.autoRenew,
    endDate: row.endDate,
    fees: row.fees.map(toFee),
  };
}

export async function listSubscriptionsWithFees(): Promise<SubscriptionRecord[]> {
  const rows = await db.subscription.findMany({ include: { fees: true } });
  return rows.map(toRecord);
}
