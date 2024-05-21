import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { t } from 'i18next';
import { stakingGetStakedTokens } from '@/smart-contracts/Staking/staking-get-staked-tokens';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import { getContractAddress } from '@/smart-contracts/get-contract-address';

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
        chainId,
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
