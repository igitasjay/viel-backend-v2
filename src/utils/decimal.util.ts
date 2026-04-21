import Decimal from 'decimal.js';

// Configure for financial precision
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -18,
  toExpPos: 28,
});

export function add(a: string, b: string): string {
  return new Decimal(a).plus(new Decimal(b)).toString();
}

export function sub(a: string, b: string): string {
  return new Decimal(a).minus(new Decimal(b)).toString();
}

export function mul(a: string, b: string): string {
  return new Decimal(a).times(new Decimal(b)).toString();
}

export function div(a: string, b: string): string {
  if (new Decimal(b).isZero()) {
    throw new Error('Division by zero');
  }
  return new Decimal(a).dividedBy(new Decimal(b)).toString();
}

export function abs(a: string): string {
  return new Decimal(a).abs().toString();
}

export function isPositive(a: string): boolean {
  return new Decimal(a).isPositive() && !new Decimal(a).isZero();
}

export function isZero(a: string): boolean {
  return new Decimal(a).isZero();
}

export function isNegative(a: string): boolean {
  return new Decimal(a).isNegative();
}

export function gte(a: string, b: string): boolean {
  return new Decimal(a).gte(new Decimal(b));
}

export function gt(a: string, b: string): boolean {
  return new Decimal(a).gt(new Decimal(b));
}

export function format(a: string, dp: number): string {
  return new Decimal(a).toFixed(dp);
}

/**
 * Convert minor units (integer) to major units string.
 * e.g. fromMinorUnits('1050', 2) => '10.50'
 *      fromMinorUnits('50000000', 8) => '0.50000000'
 */
export function fromMinorUnits(minorUnits: string, decimals: number): string {
  const divisor = new Decimal(10).pow(decimals);
  return new Decimal(minorUnits).dividedBy(divisor).toString();
}

/**
 * Convert major units string to minor units (integer string).
 * e.g. toMinorUnits('10.50', 2) => '1050'
 */
export function toMinorUnits(majorUnits: string, decimals: number): string {
  const multiplier = new Decimal(10).pow(decimals);
  return new Decimal(majorUnits).times(multiplier).toFixed(0);
}

/**
 * Sum an array of string amounts.
 */
export function sum(amounts: string[]): string {
  return amounts.reduce((acc, val) => add(acc, val), '0');
}
