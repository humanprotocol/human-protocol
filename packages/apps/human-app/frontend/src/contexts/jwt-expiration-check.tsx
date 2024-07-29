import type React from 'react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGetAccessTokenMutation } from '@/api/servieces/common/get-access-token';
import { useWeb3Auth } from '@/auth-web3/use-web3-auth';
import { useAuth } from '@/auth/use-auth';

export function JWTExpirationCheck({
  children,
}: {
  children: React.ReactElement;
}) {
  const web3Auth = useWeb3Auth();
  const web2Auth = useAuth();
  const location = useLocation();
  const { mutate: getAccessTokenMutation } = useGetAccessTokenMutation();

  useEffect(() => {
    const web3TokenExpired = Boolean(
      web3Auth.user?.exp && web3Auth.user.exp < Date.now() / 1000
    );
    if (web3TokenExpired) {
      getAccessTokenMutation('web3');
    }

    const web2TokenExpired = Boolean(
      web2Auth.user?.exp && web2Auth.user.exp < Date.now() / 1000
    );
    if (web2TokenExpired) {
      getAccessTokenMutation('web2');
    }
  }, [
    location,
    web3Auth.user?.exp,
    web2Auth.user?.exp,
    getAccessTokenMutation,
  ]);

  return children;
}
