import { useLocation, Navigate } from 'react-router-dom';
import { createContext } from 'react';
import { useAuth } from '@/auth/use-auth';
import { routerPaths } from '@/router/router-paths';
import type { AuthenticatedUserContextType } from '@/auth/auth-context';
import { PageCardLoader } from '@/components/ui/page-card';

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
