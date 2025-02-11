import { MainnetChains, TestnetChains } from '@/modules/smart-contracts/chains';
import type { ContractsAddresses } from '@/modules/smart-contracts/contracts';
import { env } from '@/shared/env';

export const getContractAddress = ({
  contractName,
}: {
  contractName: keyof ContractsAddresses;
}): string => {
  if (env.VITE_NETWORK === 'testnet') {
    return TestnetChains[0].addresses[contractName];
  }
  return MainnetChains[0].addresses[contractName];
};
