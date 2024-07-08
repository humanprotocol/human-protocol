import { useMutation } from '@tanstack/react-query';
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers/react';
import type { Eip1193Provider } from 'ethers';
import { BrowserProvider } from 'ethers';
import { useEffect } from 'react';
import { checkNetwork } from '@/smart-contracts/check-network';

const getSignerAndProvider = async (walletProvider: Eip1193Provider) => {
  const provider = new BrowserProvider(walletProvider);
  const signer = await provider.getSigner();
  const network = await provider.getNetwork();
  checkNetwork(network);

  return {
    provider,
    signer,
  };
};

export function useWeb3Provider() {
  const { chainId } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const useSignerAndProviderMutation = useMutation({
    mutationFn: getSignerAndProvider,
  });

  useEffect(() => {
    if (walletProvider) {
      useSignerAndProviderMutation.mutate(walletProvider);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- not nesseccary
  }, [walletProvider, chainId]);

  return useSignerAndProviderMutation;
}
