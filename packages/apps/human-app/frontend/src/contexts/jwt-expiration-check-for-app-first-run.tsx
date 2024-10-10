import type React from 'react';
import { useEffect } from 'react';
import { useGetAccessTokenMutation } from '@/api/services/common/get-access-token';
import { useWeb3Auth } from '@/auth-web3/use-web3-auth';
import { useAuth } from '@/auth/use-auth';

export function JWTExpirationCheckForAppFirstRun({
  children,
}: {
  children: React.ReactElement[];
}) {
  const web3Auth = useWeb3Auth();
  const web2Auth = useAuth();
  const { mutate: getAccessTokenMutation } = useGetAccessTokenMutation();

  useEffect(() => {
    const web3TokenExpired = Boolean(
      web3Auth.user?.exp && web3Auth.user.exp < Date.now() / 1000
    );
    if (web3TokenExpired) {
      getAccessTokenMutation({
        authType: 'web3',
        throwExpirationModalOnSignOut: false,
      });
    }

    const web2TokenExpired = Boolean(
      web2Auth.user?.exp && web2Auth.user.exp < Date.now() / 1000
    );
    if (web2TokenExpired) {
      getAccessTokenMutation({
        authType: 'web3',
        throwExpirationModalOnSignOut: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return children;
}
