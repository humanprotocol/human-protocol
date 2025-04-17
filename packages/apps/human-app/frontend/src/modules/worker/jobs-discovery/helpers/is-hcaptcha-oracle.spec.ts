import { describe, expect, it, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { env } from '@/shared/env';
import { isHCaptchaOracle } from './is-hcaptcha-oracle';

vi.mock('@/shared/env', () => ({
  env: {
    VITE_H_CAPTCHA_ORACLE_ADDRESS: '0x1234567890abcdef1234567890abcdef12345678',
  },
}));

describe('isHCaptchaOracle Helper', () => {
  it('should return true when the address matches the hCaptcha oracle address', () => {
    const result = isHCaptchaOracle(
      '0x1234567890abcdef1234567890abcdef12345678'
    );
    expect(result).toBe(true);
  });

  it('should return false when the address does not match the hCaptcha oracle address', () => {
    const result = isHCaptchaOracle(faker.finance.ethereumAddress());
    expect(result).toBe(false);
  });

  it('should handle case sensitivity correctly', () => {
    const mixedCaseAddress = env.VITE_H_CAPTCHA_ORACLE_ADDRESS.replace(
      'abcdef',
      'ABCDEF'
    );

    const result = isHCaptchaOracle(mixedCaseAddress);
    expect(result).toBe(true);
  });

  it('should handle empty strings', () => {
    const result = isHCaptchaOracle('');
    expect(result).toBe(false);
  });
});
