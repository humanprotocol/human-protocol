import { useContext } from 'react';
import { ConnectedWalletContext } from './require-wallet-connect';

export const useConnectedWallet = () => {
  const context = useContext(ConnectedWalletContext);

  if (!context) {
    throw new Error(
      'Cannot use context of useConnectedWallet. Component is not included in protectedWeb3Routes'
    );
  }

  return context;
};
