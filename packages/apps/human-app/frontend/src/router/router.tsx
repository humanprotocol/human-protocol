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
import { routerPaths } from './router-paths';
import { ProtectedLayout, UnprotectedLayout } from './components';

export function Router() {
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
      {protectedRoutes.map(({ routerProps }) => {
        return (
          <Route
            element={
              <RequireAuth>
                <ProtectedLayout />
              </RequireAuth>
            }
            key={routerProps.path}
            path={routerProps.path}
          >
            <Route element={routerProps.element} path={routerProps.path} />
          </Route>
        );
      })}
      {web3ProtectedRoutes.map(({ routerProps }) => (
        <Route
          element={
            <RequireWalletConnect>
              <RequireWeb3Auth>
                <ProtectedLayout />
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
