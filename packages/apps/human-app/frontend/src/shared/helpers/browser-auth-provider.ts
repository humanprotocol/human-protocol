/* eslint-disable camelcase -- ...*/
import type { BrowserAuthProvider } from '@/shared/types/browser-auth-provider';

const accessTokenKey = btoa('access_token');
const refreshTokenKey = btoa('refresh_token');
const authTypeKey = btoa('auth_type');

const browserAuthProvider: BrowserAuthProvider = {
  isAuthenticated: false,
  authType: 'web2',
  signIn({ access_token, refresh_token }, authType) {
    browserAuthProvider.isAuthenticated = true;
    browserAuthProvider.authType = authType;
    localStorage.setItem(accessTokenKey, btoa(access_token));
    localStorage.setItem(refreshTokenKey, btoa(refresh_token));
    localStorage.setItem(authTypeKey, btoa(authType));
  },
  signOut(callback) {
    browserAuthProvider.isAuthenticated = false;
    localStorage.removeItem(accessTokenKey);
    localStorage.removeItem(refreshTokenKey);
    localStorage.removeItem(authTypeKey);
    if (callback) {
      callback();
    }
  },
  getAccessToken() {
    const result = localStorage.getItem(accessTokenKey);
    if (!result) {
      return null;
    }

    return atob(result);
  },
  getRefreshToken() {
    const result = localStorage.getItem(refreshTokenKey);

    if (!result) {
      return null;
    }

    return atob(result);
  },
  getAuthType() {
    const result = localStorage.getItem(authTypeKey);

    if (!result) {
      return null;
    }

    return atob(result);
  },
};

export { browserAuthProvider };
