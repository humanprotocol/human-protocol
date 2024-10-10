import type React from 'react';
import { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useGetAccessTokenMutation } from '@/api/services/common/get-access-token';
import { browserAuthProvider } from '@/shared/helpers/browser-auth-provider';

export function JWTExpirationCheckForFirstAppRun({
  children,
}: {
  children: React.ReactElement[];
}) {
  const { mutate: getAccessTokenMutation } = useGetAccessTokenMutation();

  useEffect(() => {
    const accessToken = browserAuthProvider.getAccessToken();
    const authType = browserAuthProvider.getAuthType();

    if (!accessToken) {
      browserAuthProvider.signOut({ triggerSignOutSubscriptions: false });
      return;
    }

    const userData = jwtDecode(accessToken);

    const web3TokenExpired = Boolean(
      authType === 'web3' && userData.exp && userData.exp < Date.now() / 1000
    );

    if (web3TokenExpired) {
      getAccessTokenMutation({
        authType: 'web3',
        throwExpirationModalOnSignOut: false,
      });
    }

    const web2TokenExpired = Boolean(
      authType === 'web3' && userData.exp && userData.exp < Date.now() / 1000
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
