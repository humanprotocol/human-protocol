import { useQuery } from '@tanstack/react-query';
import { useConnectedWallet } from '@/shared/contexts/wallet-connect';
import { hmTokenDecimals } from '@/modules/smart-contracts/HMToken/hm-token-decimals';
import { getContractAddress } from '@/modules/smart-contracts/get-contract-address';

export function useHMTokenDecimals() {
  const {
    chainId,
    web3ProviderMutation: { data },
  } = useConnectedWallet();

  return useQuery({
    queryFn: () => {
      const contractAddress = getContractAddress({
        contractName: 'HMToken',
      });
      return hmTokenDecimals({
        contractAddress,
        chainId,
        signer: data?.signer,
      });
    },
    queryKey: ['decimals', chainId, data?.signer ?? 'signer'],
  });
}
