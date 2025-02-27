import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout as LayoutProtected } from '@/shared/components/layout/protected/layout';
import { Layout as LayoutUnprotected } from '@/shared/components/layout/unprotected/layout';
import {
  protectedRoutes,
  walletConnectRoutes,
  unprotectedRoutes,
  web3ProtectedRoutes,
} from '@/router/routes';
import { RequireAuth } from '@/modules/auth/providers/require-auth';
import { RequireWalletConnect } from '@/shared/contexts/wallet-connect';
import { RequireWeb3Auth } from '@/modules/auth-web3/providers/require-web3-auth';
import { DrawerNavigation } from '@/shared/components/layout/protected/drawer-navigation';
import {
  workerDrawerTopMenuItems,
  workerDrawerBottomMenuItems,
} from '@/shared/components/layout/drawer-menu-items/drawer-menu-items-worker';
import { operatorDrawerBottomMenuItems } from '@/shared/components/layout/drawer-menu-items/drawer-menu-items-operator';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { UserStatsDrawer } from '@/modules/worker/hcaptcha-labeling';
import { routerPaths } from './router-paths';

export function Router() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route element={<LayoutUnprotected />}>
        {unprotectedRoutes.map((route) => (
          <Route element={route.element} key={route.path} path={route.path} />
        ))}
      </Route>
      <Route element={<LayoutUnprotected />}>
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
                <LayoutProtected
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
                <LayoutProtected
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
