import type { SignInSuccessResponse } from '@/api/servieces/worker/sign-in';
import type {
  AuthType,
  BrowserAuthProvider,
} from '@/shared/types/browser-auth-provider';

const accessTokenKey = btoa('access_token');
const refreshTokenKey = btoa('refresh_token');
const authTypeKey = btoa('auth_type');

const browserAuthProvider: BrowserAuthProvider = {
  isAuthenticated: false,
  authType: 'web2',
  signOutCallback: (() => undefined) as () => void,
  signIn(singIsSuccess: SignInSuccessResponse, authType: AuthType) {
    browserAuthProvider.isAuthenticated = true;
    browserAuthProvider.authType = authType;
    localStorage.setItem(accessTokenKey, btoa(singIsSuccess.access_token));
    localStorage.setItem(refreshTokenKey, btoa(singIsSuccess.refresh_token));
    localStorage.setItem(authTypeKey, btoa(authType));
  },
  signOut() {
    browserAuthProvider.isAuthenticated = false;
    localStorage.removeItem(accessTokenKey);
    localStorage.removeItem(refreshTokenKey);
    localStorage.removeItem(authTypeKey);
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
  unsubscribeSignOut() {
    browserAuthProvider.signOutCallback = () => undefined;
  },
  triggerSignOutSubscriptions() {
    browserAuthProvider.signOutCallback();
  },
};

export { browserAuthProvider };
