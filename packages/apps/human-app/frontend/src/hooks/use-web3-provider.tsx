import { useWeb3ModalProvider } from '@web3modal/ethers/react';
import type { JsonRpcSigner } from 'ethers';
import { BrowserProvider } from 'ethers';
import { useEffect, useState } from 'react';

export function useWeb3Provider() {
  const { walletProvider } = useWeb3ModalProvider();
  const [provider, setProvider] = useState<BrowserProvider>();
  const [signer, setSigner] = useState<JsonRpcSigner>();

  useEffect(() => {
    void (async () => {
      try {
        if (walletProvider) {
          const _provider = new BrowserProvider(walletProvider);
          const _signer = await _provider.getSigner();

          setProvider(_provider);
          setSigner(_signer);
        }
      } catch {
        /* empty */
      }
    })();
  }, [walletProvider]);

  return { provider, signer };
}
