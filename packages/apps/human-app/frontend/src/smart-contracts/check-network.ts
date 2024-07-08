import { t } from 'i18next';
import type { Network } from 'ethers';
import { chains } from '@/smart-contracts/chains';

export const checkNetwork = (network: Network): void => {
  const chainData = chains.find(
    ({ chainId: _chainId }) => BigInt(_chainId) === network.chainId
  );

  if (!chainData) {
    if (!network.name) {
      throw new Error(t('errors.unsupportedNetwork'));
    }

    throw new Error(
      t('errors.unsupportedNetworkWithName', { networkName: network.name })
    );
  }
};
