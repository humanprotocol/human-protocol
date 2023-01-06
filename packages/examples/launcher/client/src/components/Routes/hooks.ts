import * as React from 'react';
import { getIsJwtExpired } from 'components/helpers/getIsJwtExpired';
import { signIn, signOut } from 'services/redux/slices/authSlice';
import { store } from 'services/redux/store';
import { useRefreshTokenMutation } from 'services/redux/api/authApi';

export const useAuthHook = () => {
  const [refresh] = useRefreshTokenMutation();
  const token = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  React.useEffect(() => {
    if (token && refreshToken) {
      const isJwtExpired = getIsJwtExpired(token);
      if (!isJwtExpired) {
        store.dispatch(signIn());
      } else {
        try {
          refresh({ refreshToken });
          store.dispatch(signIn());
        } catch (err) {
          console.error(err);
          store.dispatch(signOut());
        }
      }
    } else {
      store.dispatch(signOut());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken, token]);
};
