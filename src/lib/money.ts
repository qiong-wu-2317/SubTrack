declare const centsBrand: unique symbol;

/** Integer minor units (BR-1, ADR-3). Construct with `cents()`. */
export type Cents = number & { readonly [centsBrand]: true };

/** BR-1: money is integer minor units, never a float. */
export function cents(value: number): Cents {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Cents must be a safe integer, got ${value}`);
  }
  return value as Cents;
}

/**
 * Non-negative integer division rounded half up, using integer operands only.
 * BR-2: the single rounding step at the end of a normalization.
 */
export function roundDiv(numerator: number, denominator: number): number {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator)) {
    throw new RangeError("roundDiv operands must be safe integers");
  }
  if (denominator <= 0) throw new RangeError("roundDiv denominator must be positive");
  if (numerator < 0) throw new RangeError("roundDiv numerator must be non-negative");
  return Math.floor((2 * numerator + denominator) / (2 * denominator));
}

/** The only place that converts minor units to major units (CLAUDE.md money convention). */
export function formatCents(amount: Cents, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount / 100);
}
