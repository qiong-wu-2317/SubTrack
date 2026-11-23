import { cents, roundDiv, type Cents } from "@/lib/money";
import type { Billable, BillingCycle } from "@/lib/types";

/** An exact multiplier as an integer fraction, so no float ever touches money. */
type Ratio = { num: number; den: number };
type Period = "monthly" | "yearly";

/**
 * Per-cycle multipliers. BR-2 gives the monthly column; BR-10 gives the yearly column,
 * which is derived from the cycle directly, never as monthly × 12.
 */
const FIXED_CYCLE_RATIOS: Record<Exclude<BillingCycle, "custom">, Record<Period, Ratio>> = {
  weekly: { monthly: { num: 52, den: 12 }, yearly: { num: 52, den: 1 } },
  monthly: { monthly: { num: 1, den: 1 }, yearly: { num: 12, den: 1 } },
  quarterly: { monthly: { num: 1, den: 3 }, yearly: { num: 4, den: 1 } },
  yearly: { monthly: { num: 1, den: 12 }, yearly: { num: 1, den: 1 } },
};

function intervalDaysOf(sub: Billable): number {
  const days = sub.intervalDays;
  if (days === null || !Number.isSafeInteger(days) || days <= 0) {
    throw new RangeError("A custom billing cycle needs a positive integer intervalDays");
  }
  return days;
}

function ratioFor(sub: Billable, period: Period): Ratio {
  if (sub.billingCycle !== "custom") return FIXED_CYCLE_RATIOS[sub.billingCycle][period];
  // Custom cycles: 365 days a year, spread over 12 months.
  const days = intervalDaysOf(sub);
  return period === "monthly" ? { num: 365, den: 12 * days } : { num: 365, den: days };
}

// BR-9: recurring fees are charged once per cycle; one-time fees are not run-rate.
function perCycleCents(sub: Billable): number {
  let total: number = sub.amountCents;
  for (const fee of sub.fees) {
    if (fee.recurring) total += fee.amountCents;
  }
  return total;
}

function normalize(sub: Billable, period: Period): Cents {
  const { num, den } = ratioFor(sub, period);
  // BR-2: scale the whole per-cycle amount, then round exactly once.
  return cents(roundDiv(perCycleCents(sub) * num, den));
}

export function monthlyCostCents(sub: Billable): Cents {
  return normalize(sub, "monthly");
}

export function yearlyCostCents(sub: Billable): Cents {
  return normalize(sub, "yearly");
}
