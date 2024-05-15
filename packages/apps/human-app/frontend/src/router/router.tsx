import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout as LayoutProtected } from '@/components/layout/protected/layout';
import { Layout as LayoutUnprotected } from '@/components/layout/unprotected/layout';
import {
  protectedRoutes,
  protectedWeb3Routes,
  unprotectedRoutes,
} from '@/router/routes';
import { RequireAuth } from '@/auth/require-auth';
import { RequireWeb3Auth } from '@/auth-web3/require-web3-auth';

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LayoutUnprotected />}>
          {unprotectedRoutes.map((route) => (
            <Route element={route.element} key={route.path} path={route.path} />
          ))}
        </Route>
        <Route element={<LayoutUnprotected />}>
          {protectedWeb3Routes.map((route) => (
            <Route
              element={
                <RequireWeb3Auth>
                  <>{route.element}</>
                </RequireWeb3Auth>
              }
              key={route.path}
              path={route.path}
            />
          ))}
        </Route>
        {protectedRoutes.map(({ routerProps, pageHeaderProps }) => (
          <Route
            element={<LayoutProtected pageHeaderProps={pageHeaderProps} />}
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
      </Routes>
    </BrowserRouter>
  );
}
