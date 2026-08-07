import { createContext, type ReactNode } from 'react';
import { useLocation, Navigate } from 'react-router-dom';

import { useAuth } from '@/modules/auth/hooks/use-auth';
import { routerPaths } from '@/router/router-paths';
import { PageCardLoader } from '@/shared/components/ui/page-card';
import { type AuthenticatedUserContextType } from '@/shared/contexts/generic-auth-context';
import { type UserData } from '../context/auth-context';
import { useIsUserVerified } from '@/shared/hooks';

export const AuthenticatedUserContext =
  createContext<AuthenticatedUserContextType<UserData> | null>(null);

export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();
  const isUserVerified = useIsUserVerified();

  if (auth.status === 'loading') {
    return <PageCardLoader />;
  }

  if (!auth.user) {
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
