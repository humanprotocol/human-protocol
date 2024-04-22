import { useMutation } from '@tanstack/react-query';
import { useWeb3ModalProvider } from '@web3modal/ethers/react';
import type { Eip1193Provider } from 'ethers';
import { BrowserProvider } from 'ethers';
import { useEffect } from 'react';

const setWallet = async (walletProvider: Eip1193Provider) => {
  const provider = new BrowserProvider(walletProvider);
  const signer = await provider.getSigner();

  return {
    provider,
    signer,
  };
};

export function useWeb3Provider() {
  const { walletProvider } = useWeb3ModalProvider();
  const mutationResult = useMutation({ mutationFn: setWallet });

  useEffect(() => {
    if (walletProvider) {
      mutationResult.mutate(walletProvider);
    }
  }, [mutationResult, walletProvider]);

  return mutationResult;
}
