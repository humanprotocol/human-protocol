import { useQuery } from '@tanstack/react-query';
import { getStackedAmount } from '@/smart-contracts/stake/get-staked-amount';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';

export function useGetStakedAmount() {
  const {
    address,
    chainId,
    web3ProviderMutation: { data },
  } = useConnectedWallet();

  return useQuery({
    queryFn: () =>
      getStackedAmount({
        stakerAddress: address,
        chainId,
        signer: data?.signer,
      }),
    queryKey: ['getStackedAmount', address, chainId, data?.signer],
    refetchInterval: 0,
  });
}
