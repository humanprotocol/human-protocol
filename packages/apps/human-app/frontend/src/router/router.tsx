import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout as LayoutProtected } from '@/components/layout/protected/layout';
import { Layout as LayoutUnprotected } from '@/components/layout/unprotected/layout';
import { protectedRoutes, unprotectedRoutes } from '@/router/routes';
import { RequireAuth } from '@/auth/require-auth';

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LayoutUnprotected />}>
          {unprotectedRoutes.map((route) => (
            <Route element={route.element} key={route.path} path={route.path} />
          ))}
        </Route>
        <Route element={<LayoutProtected />}>
          {protectedRoutes.map((route) => (
            <Route
              element={
                <RequireAuth>
                  <>{route.element}</>
                </RequireAuth>
              }
              key={route.path}
              path={route.path}
            />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
