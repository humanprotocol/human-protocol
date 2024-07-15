import { Routes, Route } from 'react-router-dom';
import { Layout as LayoutProtected } from '@/components/layout/protected/layout';
import { Layout as LayoutUnprotected } from '@/components/layout/unprotected/layout';
import {
  protectedRoutes,
  walletConnectRoutes,
  unprotectedRoutes,
  web3ProtectedRoutes,
} from '@/router/routes';
import { RequireAuth } from '@/auth/require-auth';
import { RequireWalletConnect } from '@/auth-web3/require-wallet-connect';
import { RequireWeb3Auth } from '@/auth-web3/require-web3-auth';
import { DrawerNavigation } from '@/components/layout/protected/drawer-navigation';
import {
  workerDrawerTopMenuItems,
  workerDrawerBottomMenuItems,
} from '@/components/layout/drawer-menu-items/drawer-menu-items-worker';
import { operatorDrawerBottomMenuItems } from '@/components/layout/drawer-menu-items/drawer-menu-items-operator';
import { browserAuthProvider } from '@/shared/helpers/browser-auth-provider';
import { UserStatsDrawer } from '@/pages/worker/hcaptcha-labeling/hcaptcha-labeling/user-stats-drawer';
import { useAuth } from '@/auth/use-auth';

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
      {protectedRoutes.map(({ routerProps, pageHeaderProps }) => (
        <Route
          element={
            <LayoutProtected
              pageHeaderProps={pageHeaderProps}
              renderDrawer={(open, setDrawerOpen) => (
                <DrawerNavigation
                  bottomMenuItems={workerDrawerBottomMenuItems}
                  open={open}
                  setDrawerOpen={setDrawerOpen}
                  signOut={() => {
                    browserAuthProvider.signOut(() => {
                      window.location.reload();
                    });
                  }}
                  topMenuItems={workerDrawerTopMenuItems(
                    Boolean(user?.wallet_address)
                  )}
                />
              )}
              renderHCaptchaStatisticsDrawer={(isOpen) => (
                <UserStatsDrawer isOpen={isOpen} />
              )}
            />
          }
          key={routerProps.path}
        >
          <Route
            element={
              <RequireAuth>
                <>{routerProps.element}</>
              </RequireAuth>
            }
            path={routerProps.path}
          />
        </Route>
      ))}
      {web3ProtectedRoutes.map(({ routerProps, pageHeaderProps }) => (
        <Route
          element={
            <LayoutProtected
              pageHeaderProps={pageHeaderProps}
              renderDrawer={(open, setDrawerOpen) => (
                <DrawerNavigation
                  bottomMenuItems={operatorDrawerBottomMenuItems}
                  open={open}
                  setDrawerOpen={setDrawerOpen}
                  signOut={() => {
                    browserAuthProvider.signOut(() => {
                      window.location.reload();
                    });
                  }}
                />
              )}
            />
          }
          key={routerProps.path}
        >
          <Route
            element={
              <RequireWalletConnect>
                <RequireWeb3Auth>
                  <>{routerProps.element}</>
                </RequireWeb3Auth>
              </RequireWalletConnect>
            }
            path={routerProps.path}
          />
        </Route>
      ))}
    </Routes>
  );
}
