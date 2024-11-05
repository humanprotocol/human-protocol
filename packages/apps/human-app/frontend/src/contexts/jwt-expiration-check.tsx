import type React from 'react';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAccessTokenRefresh } from '@/api/services/common/use-access-token-refresh';
import { useWeb3Auth } from '@/auth-web3/use-web3-auth';
import { useAuth } from '@/auth/use-auth';

export function JWTExpirationCheck({
  children,
}: {
  children: React.ReactElement;
}) {
  const checksOnProfile = useRef(0);
  const web3Auth = useWeb3Auth();
  const web2Auth = useAuth();
  const location = useLocation();
  const { refreshAccessToken: getAccessTokenMutation } =
    useAccessTokenRefresh();

  useEffect(() => {
    if (
      location.pathname.includes('profile') &&
      (web2Auth.user ?? web3Auth.user)
    ) {
      checksOnProfile.current = checksOnProfile.current + 1;
    }
    const web3TokenExpired = Boolean(
      web3Auth.user?.exp && web3Auth.user.exp < Date.now() / 1000
    );
    if (web3TokenExpired) {
      getAccessTokenMutation({
        authType: 'web3',
        throwExpirationModalOnSignOut: checksOnProfile.current < 1,
      });
    }

    const web2TokenExpired = Boolean(
      web2Auth.user?.exp && web2Auth.user.exp < Date.now() / 1000
    );
    if (web2TokenExpired) {
      getAccessTokenMutation({
        authType: 'web2',
        throwExpirationModalOnSignOut: checksOnProfile.current < 1,
      });
    }
  }, [
    location,
    web3Auth.user?.exp,
    web2Auth.user?.exp,
    getAccessTokenMutation,
    web2Auth.user,
    web3Auth.user,
  ]);

  return children;
}
