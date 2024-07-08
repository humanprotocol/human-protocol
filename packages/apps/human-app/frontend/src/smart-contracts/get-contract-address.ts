import { t } from 'i18next';
import { chainsWithSCAddresses } from '@/smart-contracts/chains';
import type { ContractsAddresses } from '@/smart-contracts/contracts';

export const getContractAddress = ({
  chainId,
  contractName,
}: {
  chainId: number;
  contractName: keyof ContractsAddresses;
}): string => {
  const contractAddress = chainsWithSCAddresses.find(
    ({ chainId: _chainId }) => _chainId === chainId
  )?.addresses[contractName];

  if (!contractAddress) {
    throw new Error(t('errors.unsupportedNetwork'));
  }
  return contractAddress;
};
