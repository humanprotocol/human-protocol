/* eslint-disable camelcase -- ...*/
import type { BrowserAuthProvider } from '@/shared/types/browser-auth-provider';

const accessTokenKey = btoa('access_token');
const refreshTokenKey = btoa('refresh_token');
const authTypeKey = btoa('auth_type');

const browserAuthProvider: BrowserAuthProvider = {
  isAuthenticated: false,
  authType: 'web2',
  signOutCallback: (() => undefined) as () => void,
  signIn({ access_token, refresh_token }, authType) {
    browserAuthProvider.isAuthenticated = true;
    browserAuthProvider.authType = authType;
    localStorage.setItem(accessTokenKey, btoa(access_token));
    localStorage.setItem(refreshTokenKey, btoa(refresh_token));
    localStorage.setItem(authTypeKey, btoa(authType));
  },
  signOut() {
    browserAuthProvider.isAuthenticated = false;
    browserAuthProvider.signOutCallback();
    localStorage.removeItem(accessTokenKey);
    localStorage.removeItem(refreshTokenKey);
    localStorage.removeItem(authTypeKey);
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
  subscribeSignOut(callback: () => void) {
    browserAuthProvider.signOutCallback = callback;
  },
};

export { browserAuthProvider };
