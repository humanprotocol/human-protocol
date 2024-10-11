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

    const tokenExpired = Boolean(
      userData.exp && userData.exp < Date.now() / 1000
    );

    if (tokenExpired) {
      const authTypeConfig = authType === 'web3' ? 'web3' : 'web2';

      getAccessTokenMutation({
        authType: authTypeConfig,
        throwExpirationModalOnSignOut: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return children;
}
