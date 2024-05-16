import { t } from 'i18next';
import { chains } from '@/smart-contracts/chains';

export const getNetworkName = (chainId: number): string => {
  const networkName = chains.find(
    ({ chainId: _chainId }) => _chainId === chainId
  )?.name;

  if (!networkName) {
    return t('errors.unknownNetwork');
  }
  return networkName;
};
