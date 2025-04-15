import { describe, expect, it, vi } from 'vitest';
import type { Network } from 'ethers';
import { t } from 'i18next';
import { faker } from '@faker-js/faker';
import { env } from '@/shared/env';
import { MainnetChains, TestnetChains } from '@/modules/smart-contracts/chains';
import { checkNetwork } from './check-network';
import '@/shared/i18n/i18n';

vi.mock('@/shared/env', () => ({
  env: {
    VITE_NETWORK: 'testnet',
  },
}));

describe('checkNetwork Function', () => {
  it('should not throw an error for supported testnet network', () => {
    const network: Network = {
      chainId: BigInt(TestnetChains[0].chainId),
      name: 'Test Network',
    } as Network;

    expect(() => {
      checkNetwork(network);
    }).not.toThrow();
  });

  it('should throw an error for unsupported testnet network', () => {
    const networkName = faker.string.alpha(10);

    const network: Network = {
      chainId: BigInt(9999),
      name: networkName,
    } as Network;

    expect(() => {
      checkNetwork(network);
    }).toThrow(t('errors.unsupportedNetworkWithName', { networkName }));
  });

  it('should not throw an error for supported mainnet network', () => {
    vi.mocked(env).VITE_NETWORK = 'mainnet';

    const network: Network = {
      chainId: BigInt(MainnetChains[0].chainId),
      name: 'Main Network',
    } as Network;

    expect(() => {
      checkNetwork(network);
    }).not.toThrow();
  });

  it('should throw an error for unsupported mainnet network', () => {
    vi.mocked(env).VITE_NETWORK = 'mainnet';
    const networkName = faker.string.alpha(10);

    const network: Network = {
      chainId: BigInt(9999),
      name: networkName,
    } as Network;

    expect(() => {
      checkNetwork(network);
    }).toThrow(t('errors.unsupportedNetworkWithName', { networkName }));
  });
});
