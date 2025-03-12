import { Routes, Route, Navigate } from 'react-router-dom';
import {
  protectedRoutes,
  walletConnectRoutes,
  unprotectedRoutes,
  web3ProtectedRoutes,
} from '@/router/routes';
import { RequireAuth } from '@/modules/auth/providers/require-auth';
import { RequireWalletConnect } from '@/shared/contexts/wallet-connect';
import { RequireWeb3Auth } from '@/modules/auth-web3/providers/require-web3-auth';
import { DrawerNavigation } from '@/router/components/layout/protected/drawer-navigation';
import { operatorDrawerBottomMenuItems } from '@/router/components/drawer-menu-items/drawer-menu-items-operator';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { UserStatsDrawer } from '@/modules/worker/hcaptcha-labeling';
import { routerPaths } from './router-paths';
import {
  ProtectedLayout,
  UnprotectedLayout,
  workerDrawerBottomMenuItems,
  workerDrawerTopMenuItems,
} from './components';

export function Router() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route element={<UnprotectedLayout />}>
        {unprotectedRoutes.map((route) => (
          <Route element={route.element} key={route.path} path={route.path} />
        ))}
      </Route>
      <Route element={<UnprotectedLayout />}>
        {walletConnectRoutes.map((route) => (
          <Route
            element={
              <RequireWalletConnect>
                <>{route.element}</>
              </RequireWalletConnect>
            }
            key={route.path}
            path={route.path}
          />
        ))}
      </Route>
      {protectedRoutes.map(({ routerProps, pageHeaderProps }) => {
        return (
          <Route
            element={
              <RequireAuth>
                <ProtectedLayout
                  pageHeaderProps={pageHeaderProps}
                  renderDrawer={(open, setDrawerOpen) => (
                    <DrawerNavigation
                      bottomMenuItems={workerDrawerBottomMenuItems}
                      open={open}
                      setDrawerOpen={setDrawerOpen}
                      signOut={() => {
                        browserAuthProvider.signOut({
                          callback: () => {
                            window.location.reload();
                          },
                        });
                      }}
                      topMenuItems={workerDrawerTopMenuItems(user)}
                    />
                  )}
                  renderHCaptchaStatisticsDrawer={(isOpen) => (
                    <UserStatsDrawer isOpen={isOpen} />
                  )}
                  renderGovernanceBanner
                />
              </RequireAuth>
            }
            key={routerProps.path}
            path={routerProps.path}
          >
            <Route element={routerProps.element} path={routerProps.path} />
          </Route>
        );
      })}
      {web3ProtectedRoutes.map(({ routerProps, pageHeaderProps }) => (
        <Route
          element={
            <RequireWalletConnect>
              <RequireWeb3Auth>
                <ProtectedLayout
                  pageHeaderProps={pageHeaderProps}
                  renderDrawer={(open, setDrawerOpen) => (
                    <DrawerNavigation
                      bottomMenuItems={operatorDrawerBottomMenuItems}
                      open={open}
                      setDrawerOpen={setDrawerOpen}
                      signOut={() => {
                        browserAuthProvider.signOut({
                          callback: () => {
                            window.location.reload();
                          },
                        });
                      }}
                    />
                  )}
                />
              </RequireWeb3Auth>
            </RequireWalletConnect>
          }
          key={routerProps.path}
          path={routerProps.path}
        >
          <Route element={routerProps.element} path={routerProps.path} />
        </Route>
      ))}

      <Route element={<Navigate to={routerPaths.homePage} />} path="*" />
    </Routes>
  );
}
