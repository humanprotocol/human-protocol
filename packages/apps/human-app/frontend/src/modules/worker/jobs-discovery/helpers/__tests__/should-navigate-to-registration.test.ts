import { describe, expect, it } from 'vitest';
import { shouldNavigateToRegistration } from '../should-navigate-to-registration';
import { type Oracle } from '../../../hooks';

describe('shouldNavigateToRegistration Helper', () => {
  it('should return true when registration is needed and oracle address is not in the array', () => {
    const oracle: Oracle = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      registrationNeeded: true,
      chainId: 1,
      role: 'test-role',
      url: 'https://example.com',
      jobTypes: ['test-job'],
      name: 'Test Oracle',
    };

    const registrationData = {
      // eslint-disable-next-line camelcase
      oracle_addresses: ['0xabcdef1234567890abcdef1234567890abcdef12'],
    };

    const result = shouldNavigateToRegistration(oracle, registrationData);
    expect(result).toBe(true);
  });

  it('should return false when registration is needed but oracle address is in the array', () => {
    const oracle: Oracle = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      registrationNeeded: true,
      chainId: 1,
      role: 'test-role',
      url: 'https://example.com',
      jobTypes: ['test-job'],
      name: 'Test Oracle',
    };

    const registrationData = {
      // eslint-disable-next-line camelcase
      oracle_addresses: ['0x1234567890abcdef1234567890abcdef12345678'],
    };

    const result = shouldNavigateToRegistration(oracle, registrationData);
    expect(result).toBe(false);
  });

  it('should return false when registration is not needed, regardless of address', () => {
    const oracle: Oracle = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      registrationNeeded: false,
      chainId: 1,
      role: 'test-role',
      url: 'https://example.com',
      jobTypes: ['test-job'],
      name: 'Test Oracle',
    };

    const registrationData = {
      // eslint-disable-next-line camelcase
      oracle_addresses: [],
    };

    const result = shouldNavigateToRegistration(oracle, registrationData);
    expect(result).toBe(false);
  });

  it('should return false when registration is not needed and registrationData is undefined', () => {
    const oracle: Oracle = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      registrationNeeded: false,
      chainId: 1,
      role: 'test-role',
      url: 'https://example.com',
      jobTypes: ['test-job'],
      name: 'Test Oracle',
    };

    const result = shouldNavigateToRegistration(oracle);
    expect(result).toBe(false);
  });

  it('should return true when registration is needed and registrationData is undefined', () => {
    const oracle: Oracle = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      registrationNeeded: true,
      chainId: 1,
      role: 'test-role',
      url: 'https://example.com',
      jobTypes: ['test-job'],
      name: 'Test Oracle',
    };

    const result = shouldNavigateToRegistration(oracle);
    expect(result).toBe(true);
  });
});
