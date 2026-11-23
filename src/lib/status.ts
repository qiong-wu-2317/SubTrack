import { isBefore } from "date-fns";
import type { SubscriptionStatus } from "@/lib/types";

type StatusInput = {
  status: SubscriptionStatus;
  autoRenew: boolean;
  endDate: Date | null;
};

/** Midnight UTC of `now`'s calendar day (BR-7: calendar dates are stored as UTC midnight). */
function utcDayStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * The status as of `now`.
 * BR-5: a non-renewing plan whose end date has passed is expired. The end date itself is
 * still a paid day, so expiry starts the day after.
 * BR-4: only `active` and `cancelled` can become `expired`; `expired` is terminal.
 */
export function effectiveStatus(sub: StatusInput, now: Date): SubscriptionStatus {
  if (sub.status !== "active" && sub.status !== "cancelled") return sub.status;
  if (sub.autoRenew || sub.endDate === null) return sub.status;
  return isBefore(sub.endDate, utcDayStart(now)) ? "expired" : sub.status;
}
