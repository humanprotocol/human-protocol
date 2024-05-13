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
    throw new Error(`Cannot find contract address.`);
  }
  return contractAddress;
};
