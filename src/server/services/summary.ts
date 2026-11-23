import "server-only";
// RED: stub. Implement against src/server/services/summary.test.ts.
import type { CurrencySummary } from "@/lib/summary";

export async function getSpendSummary(_input: {
  currency?: string;
  now: Date;
}): Promise<CurrencySummary[]> {
  throw new Error("Not implemented: getSpendSummary");
}
