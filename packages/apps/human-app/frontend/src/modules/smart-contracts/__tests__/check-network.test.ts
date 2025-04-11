import { describe, expect, it, vi } from 'vitest';
import type { Network } from 'ethers';
import { env } from '@/shared/env';
import { MainnetChains, TestnetChains } from '@/modules/smart-contracts/chains';
import { checkNetwork } from '../check-network';

vi.mock('i18next', () => ({
  t: (key: string, _options: Record<string, unknown>) => key,
}));

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
    const network: Network = {
      chainId: BigInt(9999),
      name: 'Unsupported Network',
    } as Network;

    expect(() => {
      checkNetwork(network);
    }).toThrow('errors.unsupportedNetworkWithName');
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

    const network: Network = {
      chainId: BigInt(9999),
      name: 'Unsupported Network',
    } as Network;

    expect(() => {
      checkNetwork(network);
    }).toThrow('errors.unsupportedNetworkWithName');
  });
});
