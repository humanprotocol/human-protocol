import Decimal from 'decimal.js';

export function mul(a: number, b: number): number {
  const decimalA = new Decimal(a);
  const decimalB = new Decimal(b);

  const result = decimalA.times(decimalB);

  return result.toNumber();
}

export function div(a: number, b: number): number {
  const decimalA = new Decimal(a);
  const decimalB = new Decimal(b);

  if (decimalB.isZero()) {
    throw new Error('Division by zero is not allowed.');
  }

  const result = decimalA.dividedBy(decimalB);

  return result.toNumber();
}

export function add(a: number, b: number): number {
  const decimalA = new Decimal(a);
  const decimalB = new Decimal(b);

  const result = decimalA.plus(decimalB);

  return result.toNumber();
}

export function sub(a: number, b: number): number {
  const decimalA = new Decimal(a);
  const decimalB = new Decimal(b);

  const result = decimalA.minus(decimalB);

  return result.toNumber();
}

export function eq(a: number, b: number): boolean {
  const decimalA = new Decimal(a);
  const decimalB = new Decimal(b);

  return decimalA.eq(decimalB);
}

export function lt(a: number, b: number): boolean {
  const decimalA = new Decimal(a);
  const decimalB = new Decimal(b);

  return decimalA.lt(decimalB);
}

export function gt(a: number, b: number): boolean {
  const decimalA = new Decimal(a);
  const decimalB = new Decimal(b);

  return decimalA.gt(decimalB);
}
