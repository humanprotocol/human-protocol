import { useContext } from 'react';
import { AuthWeb3Context } from '@/auth-web3/require-wallet-connect';

export const useConnectedWallet = () => {
  const context = useContext(AuthWeb3Context);

  if (!context) {
    throw new Error(
      'Cannot use context of useConnectedWallet. Component is not included in protectedWeb3Routes'
    );
  }

  return context;
};
