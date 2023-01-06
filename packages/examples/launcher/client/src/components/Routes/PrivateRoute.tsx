import * as React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthHook } from 'components/Routes/hooks';

import { makeIsTokenAuthenticated } from 'services/redux/selectors/auth';

export const PrivateAuthTokenRoute = () => {
  useAuthHook();

  const isIsAuth = useSelector(makeIsTokenAuthenticated);

  return isIsAuth ? <Outlet /> : <Navigate to="/" />;
};
