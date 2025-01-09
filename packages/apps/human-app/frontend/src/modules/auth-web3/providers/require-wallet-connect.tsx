import { useLocation, Navigate } from 'react-router-dom';
import { createContext } from 'react';
import { useWalletConnect } from '@/shared/hooks/use-wallet-connect';
import type { WalletConnectContextConnectedAccount } from '@/shared/contexts/wallet-connect';
import { routerPaths } from '@/router/router-paths';
import { PageCardLoader } from '@/shared/components/ui/page-card-loader';

export const AuthWeb3Context =
  createContext<WalletConnectContextConnectedAccount | null>(null);

export function RequireWalletConnect({ children }: { children: JSX.Element }) {
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
