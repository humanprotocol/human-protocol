import React, { PropsWithChildren } from 'react';
import { useGetIsLoggedIn } from '@multiversx/sdk-dapp/hooks';
import { Navigate } from 'react-router-dom';

export const AuthRedirectWrapper = ({ children }: PropsWithChildren) => {
  const isLoggedIn = useGetIsLoggedIn();

  if (isLoggedIn) {
    return <Navigate to={'/'} />;
  }

  return <>{children}</>;
};
