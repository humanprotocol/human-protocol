import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { routerPaths } from '@/router/router-paths';
import { protectedRoutes } from '@/router/routes';
import { useUiConfig } from '@/shared/providers/ui-config-provider';
import { Navigate, useLocation, matchPath } from 'react-router-dom';

const stakeProtectedPaths = protectedRoutes
  .map((route) => route.routerProps.path)
  .filter((path) => path !== routerPaths.worker.profile);

export function RequireStake({
  children,
}: Readonly<{ children: JSX.Element }>) {
  const { user } = useAuthenticatedUser();
  const location = useLocation();
  const { uiConfig } = useUiConfig();

  const isStakeProtectedRoute = stakeProtectedPaths.some(
    (path) => path && matchPath(path, location.pathname)
  );

  if (
    uiConfig?.stakingEligibilityEnabled &&
    !user?.is_stake_eligible &&
    isStakeProtectedRoute
  ) {
    return <Navigate to={routerPaths.worker.profile} />;
  }

  return children;
}
