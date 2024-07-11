import { MainnetChains, TestnetChains } from '@/smart-contracts/chains';
import { env } from '@/shared/env';

export const getNetworkName = (): string => {
  if (env.VITE_NETWORK === 'testnet') {
    return TestnetChains[0]?.name;
  }
  return MainnetChains[0]?.name;
};
