import { AllTestnetsChains, AllMainnetChains } from '@/smart-contracts/chains';
import { env } from '@/shared/env';

export const getNetworkName = (chainId: number): string | null => {
  if (env.VITE_NETWORK === 'testnet') {
    return AllTestnetsChains.find((el) => el.chainId === chainId)?.name ?? '';
  }
  return AllMainnetChains.find((el) => el.chainId === chainId)?.name ?? '';
};
