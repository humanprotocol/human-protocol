import { useQuery } from '@tanstack/react-query';
import { stakingGetStakedTokens } from '@/modules/smart-contracts/Staking/staking-get-staked-tokens';
import { useConnectedWallet } from '@/shared/contexts/wallet-connect';
import { getContractAddress } from '@/modules/smart-contracts/get-contract-address';

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
