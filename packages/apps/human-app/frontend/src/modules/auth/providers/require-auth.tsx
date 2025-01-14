import { useLocation, Navigate } from 'react-router-dom';
import { createContext } from 'react';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { routerPaths } from '@/router/router-paths';
import type { AuthenticatedUserContextType } from '@/modules/auth/context/auth-context';
import { PageCardLoader } from '@/shared/components/ui/page-card-loader';

export const AuthenticatedUserContext =
  createContext<AuthenticatedUserContextType | null>(null);

export function RequireAuth({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === 'loading') {
    return <PageCardLoader />;
  }

  if (!auth.user) {
    return (
      <Navigate replace state={{ from: location }} to={routerPaths.homePage} />
    );
  }

  return (
    <AuthenticatedUserContext.Provider value={auth}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
}
