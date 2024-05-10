import { useQuery } from '@tanstack/react-query';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import { decimals } from '@/smart-contracts/HMToken/decimals';
import { getContractAddress } from '@/smart-contracts/get-contract-address';

export function useHMTokenDecimals() {
  const {
    chainId,
    web3ProviderMutation: { data },
  } = useConnectedWallet();

  return useQuery({
    queryFn: () => {
      const contractAddress = getContractAddress({
        chainId,
        contractName: 'HMToken',
      });
      return decimals({
        contractAddress,
        chainId,
        signer: data?.signer,
      });
    },
    queryKey: ['decimals', chainId, data?.signer || 'signer'],
  });
}
