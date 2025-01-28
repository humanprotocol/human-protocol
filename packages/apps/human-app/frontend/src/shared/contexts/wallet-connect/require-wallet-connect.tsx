import { useLocation, Navigate } from 'react-router-dom';
import { createContext } from 'react';
import { routerPaths } from '@/router/router-paths';
import { PageCardLoader } from '@/shared/components/ui/page-card';
import { type WalletConnectContextConnectedAccount } from './types';
import { useWalletConnect } from './use-wallet-connect';

export const AuthWeb3Context =
  createContext<WalletConnectContextConnectedAccount | null>(null);

export function RequireWalletConnect({
  children,
}: Readonly<{ children: JSX.Element }>) {
  const walletConnect = useWalletConnect();
  const location = useLocation();

  if (walletConnect.initializing) {
    return <PageCardLoader />;
  }

  if (!walletConnect.isConnected) {
    return (
      <Navigate
        replace
        state={{ from: location }}
        to={routerPaths.operator.connectWallet}
      />
    );
  }

  return (
    <AuthWeb3Context.Provider value={walletConnect}>
      {children}
    </AuthWeb3Context.Provider>
  );
}
