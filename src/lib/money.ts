// RED: stub. Implement against src/lib/money.test.ts.
declare const centsBrand: unique symbol;

/** Integer minor units (BR-1, ADR-3). Construct with `cents()`. */
export type Cents = number & { readonly [centsBrand]: true };

export function cents(_value: number): Cents {
  throw new Error("Not implemented: cents");
}

export function roundDiv(_numerator: number, _denominator: number): number {
  throw new Error("Not implemented: roundDiv");
}

export function formatCents(_amount: Cents, _currency: string, _locale?: string): string {
  throw new Error("Not implemented: formatCents");
}
