import type { SignInSuccessResponse } from '@/api/servieces/worker/sign-in';
import type { BrowserAuthProvider } from '@/shared/types/browser-auth-provider';

const accessTokenKey = btoa('access_token');
const refreshTokenKey = btoa('refresh_token');

const browserAuthProvider: BrowserAuthProvider = {
  isAuthenticated: false,
  signOutCallback: (() => undefined) as () => void,
  signIn(singIsSuccess: SignInSuccessResponse) {
    browserAuthProvider.isAuthenticated = true;
    localStorage.setItem(accessTokenKey, btoa(singIsSuccess.access_token));
    localStorage.setItem(refreshTokenKey, btoa(singIsSuccess.refresh_token));
  },
  signOut() {
    browserAuthProvider.isAuthenticated = false;
    localStorage.removeItem(accessTokenKey);
    localStorage.removeItem(refreshTokenKey);
    browserAuthProvider.triggerSignOutSubscriptions();
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
  subscribeSignOut(callback: () => void) {
    browserAuthProvider.signOutCallback = callback;
  },
  unsubscribeSignOut() {
    browserAuthProvider.signOutCallback = () => undefined;
  },
  triggerSignOutSubscriptions() {
    browserAuthProvider.signOutCallback();
  },
};

export { browserAuthProvider };
