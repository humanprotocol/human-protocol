import { useLocation, Navigate } from 'react-router-dom';
import { createContext } from 'react';
import { routerPaths } from '@/router/router-paths';
import type { Web3AuthenticatedUserContextType } from '@/modules/auth-web3/context/web3-auth-context';
import { PageCardLoader } from '@/shared/components/ui/page-card';
import { useWeb3Auth } from '@/modules/auth-web3/hooks/use-web3-auth';

export const Web3AuthenticatedUserContext =
  createContext<Web3AuthenticatedUserContextType | null>(null);

export function RequireWeb3Auth({
  children,
}: Readonly<{ children: JSX.Element }>) {
  const web3Auth = useWeb3Auth();
  const location = useLocation();

  if (web3Auth.status === 'loading') {
    return <PageCardLoader />;
  }

  if (!web3Auth.user) {
    return (
      <Navigate replace state={{ from: location }} to={routerPaths.homePage} />
    );
  }

  if (web3Auth.user.status !== 'success') {
    return (
      <Navigate
        replace
        state={{ from: location }}
        to={routerPaths.operator.connectWallet}
      />
    );
  }

  return (
    <Web3AuthenticatedUserContext.Provider value={web3Auth}>
      {children}
    </Web3AuthenticatedUserContext.Provider>
  );
}
