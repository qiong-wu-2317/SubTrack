import { describe, expect, it } from "vitest";
import { cents, formatCents, roundDiv } from "@/lib/money";

describe("cents", () => {
  it("BR-1: accepts integer minor units", () => {
    expect(cents(1999)).toBe(1999);
  });

  it("BR-1: rejects fractional amounts", () => {
    expect(() => cents(19.99)).toThrow(/integer/);
  });

  it("BR-1: rejects non-finite amounts", () => {
    expect(() => cents(Number.NaN)).toThrow(RangeError);
    expect(() => cents(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("roundDiv", () => {
  it("divides exactly when there is no remainder", () => {
    expect(roundDiv(1200, 12)).toBe(100);
  });

  it("rounds half up", () => {
    expect(roundDiv(5, 2)).toBe(3);
    expect(roundDiv(7, 2)).toBe(4);
  });

  it("rounds below half down", () => {
    expect(roundDiv(10, 3)).toBe(3);
    expect(roundDiv(20, 3)).toBe(7);
  });

  it("returns 0 for a zero numerator", () => {
    expect(roundDiv(0, 7)).toBe(0);
  });

  it("rejects a non-positive denominator", () => {
    expect(() => roundDiv(10, 0)).toThrow(RangeError);
    expect(() => roundDiv(10, -2)).toThrow(RangeError);
  });

  it("rejects non-integer operands", () => {
    expect(() => roundDiv(1.5, 2)).toThrow(RangeError);
    expect(() => roundDiv(3, 1.5)).toThrow(RangeError);
  });

  it("rejects a negative numerator", () => {
    expect(() => roundDiv(-5, 2)).toThrow(RangeError);
  });
});

describe("formatCents", () => {
  it("formats USD minor units", () => {
    expect(formatCents(cents(123456), "USD", "en-US")).toBe("$1,234.56");
  });

  it("formats EUR with the locale's conventions", () => {
    expect(formatCents(cents(799), "EUR", "en-US")).toBe("€7.99");
  });

  it("formats zero", () => {
    expect(formatCents(cents(0), "USD", "en-US")).toBe("$0.00");
  });
});
