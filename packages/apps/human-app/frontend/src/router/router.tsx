import { Routes, Route, Navigate } from 'react-router-dom';

import { protectedRoutes, unprotectedRoutes } from '@/router/routes';
import { RequireAuth } from '@/modules/auth/providers/require-auth';
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

      <Route element={<Navigate to={routerPaths.homePage} />} path="*" />
    </Routes>
  );
}
