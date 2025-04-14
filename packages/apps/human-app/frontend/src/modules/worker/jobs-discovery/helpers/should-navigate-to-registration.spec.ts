import { describe, expect, it } from 'vitest';
import { faker } from '@faker-js/faker';
import { type Oracle } from '../../services/oracles.service';
import { shouldNavigateToRegistration } from './should-navigate-to-registration';

describe('shouldNavigateToRegistration Helper', () => {
  const oracle: Oracle = {
    address: faker.finance.ethereumAddress(),
    registrationNeeded: true,
    chainId: faker.number.int({ min: 1, max: 100 }),
    role: faker.word.noun(),
    url: faker.internet.url(),
    jobTypes: [faker.word.noun()],
    name: faker.company.name(),
  };

  const oracleWithNoRegistration: Oracle = {
    ...oracle,
    registrationNeeded: false,
  };

  it('should return true when registration is needed and oracle address is not in the array', () => {
    const registrationData = {
      // eslint-disable-next-line camelcase
      oracle_addresses: [faker.finance.ethereumAddress()],
    };

    const result = shouldNavigateToRegistration(oracle, registrationData);
    expect(result).toBe(true);
  });

  it('should return false when registration is needed but oracle address is in the array', () => {
    const registrationData = {
      // eslint-disable-next-line camelcase
      oracle_addresses: [oracle.address],
    };

    const result = shouldNavigateToRegistration(oracle, registrationData);
    expect(result).toBe(false);
  });

  it('should return false when registration is not needed, regardless of address', () => {
    const registrationData = {
      // eslint-disable-next-line camelcase
      oracle_addresses: [],
    };

    const result = shouldNavigateToRegistration(
      oracleWithNoRegistration,
      registrationData
    );
    expect(result).toBe(false);
  });

  it('should return false when registration is not needed and registrationData is undefined', () => {
    const result = shouldNavigateToRegistration(oracleWithNoRegistration);
    expect(result).toBe(false);
  });

  it('should return true when registration is needed and registrationData is undefined', () => {
    const result = shouldNavigateToRegistration(oracle);
    expect(result).toBe(true);
  });
});
