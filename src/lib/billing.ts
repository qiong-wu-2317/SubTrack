import { cents, roundDiv, type Cents } from "@/lib/money";
import type { Billable } from "@/lib/types";

/** An exact multiplier as an integer fraction, so no float ever touches money. */
type Ratio = { num: number; den: number };

function intervalDaysOf(sub: Billable): number {
  const days = sub.intervalDays;
  if (days === null || !Number.isSafeInteger(days) || days <= 0) {
    throw new RangeError("A custom billing cycle needs a positive integer intervalDays");
  }
  return days;
}

// BR-2: monthly normalization factors.
function monthlyRatio(sub: Billable): Ratio {
  switch (sub.billingCycle) {
    case "weekly":
      return { num: 52, den: 12 };
    case "monthly":
      return { num: 1, den: 1 };
    case "quarterly":
      return { num: 1, den: 3 };
    case "yearly":
      return { num: 1, den: 12 };
    case "custom":
      return { num: 365, den: 12 * intervalDaysOf(sub) };
  }
}

// BR-10: yearly comes from the cycle directly, never from monthly × 12.
function yearlyRatio(sub: Billable): Ratio {
  switch (sub.billingCycle) {
    case "weekly":
      return { num: 52, den: 1 };
    case "monthly":
      return { num: 12, den: 1 };
    case "quarterly":
      return { num: 4, den: 1 };
    case "yearly":
      return { num: 1, den: 1 };
    case "custom":
      return { num: 365, den: intervalDaysOf(sub) };
  }
}

// BR-9: recurring fees are charged once per cycle; one-time fees are not run-rate.
function perCycleCents(sub: Billable): number {
  let total: number = sub.amountCents;
  for (const fee of sub.fees) {
    if (fee.recurring) total += fee.amountCents;
  }
  return total;
}

function normalize(sub: Billable, ratio: Ratio): Cents {
  // BR-2: scale the whole per-cycle amount, then round exactly once.
  return cents(roundDiv(perCycleCents(sub) * ratio.num, ratio.den));
}

export function monthlyCostCents(sub: Billable): Cents {
  return normalize(sub, monthlyRatio(sub));
}

export function yearlyCostCents(sub: Billable): Cents {
  return normalize(sub, yearlyRatio(sub));
}
