import { t } from 'i18next';
import type { Network } from 'ethers';
import { MainnetChains, TestnetChains } from '@/smart-contracts/chains';
import { env } from '@/shared/env';

export const checkNetwork = (network: Network): void => {
  if (env.VITE_NETWORK === 'testnet') {
    if (BigInt(TestnetChains[0].chainId) === network.chainId) return;
    throw new Error(
      t('errors.unsupportedNetworkWithName', { networkName: network.name })
    );
  } else {
    if (BigInt(MainnetChains[0].chainId) === network.chainId) return;
    throw new Error(
      t('errors.unsupportedNetworkWithName', { networkName: network.name })
    );
  }
};
