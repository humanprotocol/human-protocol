import { describe, expect, it } from 'vitest';
import { stakedAmountFormatter } from '../staked-amount-formatter';
import '@/shared/i18n/i18n';

describe('stakedAmountFormatter Function', () => {
  it('should format amounts with no decimal part correctly', () => {
    const amount = BigInt('1000000000000000000');

    const result = stakedAmountFormatter(amount);
    expect(result).toBe('1 HMT');
  });

  it('should format amounts with decimal part correctly', () => {
    const amount = BigInt('1500000000000000000');

    const result = stakedAmountFormatter(amount);
    expect(result).toBe('1.5 HMT');
  });

  it('should handle very small amounts', () => {
    const amount = BigInt('1');

    const result = stakedAmountFormatter(amount);
    expect(result).toBe('0.000000000000000001 HMT');
  });

  it('should handle zero amount', () => {
    const amount = BigInt('0');

    const result = stakedAmountFormatter(amount);
    expect(result).toBe('0 HMT');
  });

  it('should handle large amounts', () => {
    const amount = BigInt('1000000000000000000000');

    const result = stakedAmountFormatter(amount);
    expect(result).toBe('1000 HMT');
  });
});
