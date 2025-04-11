import { describe, expect, it, vi } from 'vitest';
import { env } from '@/shared/env';
import {
  AllTestnetsChains,
  AllMainnetChains,
} from '@/modules/smart-contracts/chains';
import { getNetworkName } from '../get-network-name';

vi.mock('@/shared/env', () => ({
  env: {
    VITE_NETWORK: 'testnet',
  },
}));

describe('getNetworkName Function', () => {
  it('should return the correct testnet chain name when VITE_NETWORK is testnet', () => {
    const chainId = AllTestnetsChains[0].chainId;
    const expectedName = AllTestnetsChains[0].name;

    const result = getNetworkName(chainId);
    expect(result).toBe(expectedName);
  });

  it('should return an empty string for non-existent testnet chain ID', () => {
    const nonExistentChainId = 999999;

    const result = getNetworkName(nonExistentChainId);
    expect(result).toBe('');
  });

  it('should return the correct mainnet chain name when VITE_NETWORK is not testnet', () => {
    vi.mocked(env).VITE_NETWORK = 'mainnet';

    const chainId = AllMainnetChains[0].chainId;
    const expectedName = AllMainnetChains[0].name;

    const result = getNetworkName(chainId);
    expect(result).toBe(expectedName);
  });

  it('should return an empty string for non-existent mainnet chain ID', () => {
    vi.mocked(env).VITE_NETWORK = 'mainnet';

    const nonExistentChainId = 999999;

    const result = getNetworkName(nonExistentChainId);
    expect(result).toBe('');
  });
});
