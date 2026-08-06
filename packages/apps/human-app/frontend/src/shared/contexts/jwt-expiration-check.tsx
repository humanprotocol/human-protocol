import type React from 'react';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAccessTokenRefresh } from '@/api/hooks/use-access-token-refresh';
import { useAuth } from '@/modules/auth/hooks/use-auth';

export function JWTExpirationCheck({
  children,
}: {
  children: React.ReactElement;
}) {
  const checksOnProfile = useRef(0);
  const auth = useAuth();
  const location = useLocation();
  const { refreshAccessToken } = useAccessTokenRefresh();

  useEffect(() => {
    if (location.pathname.includes('profile') && auth.user) {
      checksOnProfile.current = checksOnProfile.current + 1;
    }

    const isTokenExpired = Boolean(
      auth.user?.exp && auth.user.exp < Date.now() / 1000
    );

    if (isTokenExpired) {
      refreshAccessToken({
        throwExpirationModalOnSignOut: checksOnProfile.current < 1,
      });
    }
  }, [location, auth.user?.exp, refreshAccessToken, auth.user]);

  return children;
}
