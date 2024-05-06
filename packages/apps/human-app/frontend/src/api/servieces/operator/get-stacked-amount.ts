import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { getStakedTokens } from '@/smart-contracts/Staking/get-staked-tokens';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import { getContractAddress } from '@/smart-contracts/get-contract-address';

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
      const stakeAmount = await getStakedTokens({
        contractAddress,
        stakerAddress: address,
        chainId,
        signer: data?.signer,
      });

      return ethers.formatEther(stakeAmount);
    },
    queryKey: ['getStackedAmount', address, chainId, data?.signer],
    refetchInterval: 0,
  });
}
