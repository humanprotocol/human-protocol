import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { t } from 'i18next';
import { stakingGetStakedTokens } from '@/modules/smart-contracts/Staking/staking-get-staked-tokens';
import { useConnectedWallet } from '@/shared/contexts/wallet-connect';
import { getContractAddress } from '@/modules/smart-contracts/get-contract-address';

export const stakedAmountFormatter = (amount: bigint) => {
  const amountAsString = ethers.formatEther(amount);

  if (amountAsString.split('.')[1] === '0') {
    // decimals part should be omitted
    return `${amountAsString.replace('.0', '')} ${t('inputMasks.humanCurrencySuffix')}`;
  }
  return `${ethers.formatEther(amount)} ${t('inputMasks.humanCurrencySuffix')}`;
};

export function useGetStakedAmount() {
  const {
    address,
    chainId,
    web3ProviderMutation: { data },
  } = useConnectedWallet();

  return useQuery({
    queryFn: async () => {
      const contractAddress = getContractAddress({
        contractName: 'Staking',
      });
      const stakeAmount = await stakingGetStakedTokens({
        contractAddress,
        stakerAddress: address,
        chainId,
        signer: data?.signer,
      });

      return stakeAmount;
    },
    queryKey: ['getStackedAmount', address, chainId, data?.signer],
    refetchInterval: 0,
  });
}
