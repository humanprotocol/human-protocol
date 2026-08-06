import type { ReactNode } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { createContext } from 'react';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { routerPaths } from '@/router/router-paths';
import { PageCardLoader } from '@/shared/components/ui/page-card';
import { type AuthenticatedUserContextType } from '@/shared/contexts/generic-auth-context';
import { type UserData } from '../context/auth-context';
import { useIsUserVerified } from '@/shared/hooks';
import { KycStatus } from '@/modules/worker/profile/types/profile-types';

export const AuthenticatedUserContext =
  createContext<AuthenticatedUserContextType<UserData> | null>(null);

export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();
  const isUserVerified = useIsUserVerified();

  const isKycApproved = auth.user?.kyc_status === KycStatus.APPROVED;
  const isWalletConnected = auth.user?.wallet_address !== null;

  const isUserReady = isKycApproved && isWalletConnected;

  if (auth.status === 'loading') {
    return <PageCardLoader />;
  }

  if (!auth.user || !isUserReady) {
    return (
      <Navigate replace state={{ from: location }} to={routerPaths.homePage} />
    );
  }

  if (auth.user.status === 'pending') {
    return (
      <Navigate
        replace
        state={{ routerState: { email: auth.user.email } }}
        to={routerPaths.verifyEmail}
      />
    );
  }

  if (!isUserVerified) {
    return <Navigate replace to={routerPaths.verifyUser} />;
  }

  return (
    <AuthenticatedUserContext.Provider value={auth}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
}
