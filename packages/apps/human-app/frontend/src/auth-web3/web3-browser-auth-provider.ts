import type { SignInSuccessResponse } from '@/api/servieces/worker/sign-in';
import type { BrowserAuthProvider } from '@/shared/types/browser-auth-provider';

const web3AccessTokenKey = btoa('web3_access_token');
const web3RefreshTokenKey = btoa('web3_refresh_token');

const web3BrowserAuthProvider: BrowserAuthProvider = {
  isAuthenticated: false,
  signOutCallback: (() => undefined) as () => void,
  signIn(singIsSuccess: SignInSuccessResponse) {
    web3BrowserAuthProvider.isAuthenticated = true;
    localStorage.setItem(web3AccessTokenKey, btoa(singIsSuccess.access_token));
    localStorage.setItem(
      web3RefreshTokenKey,
      btoa(singIsSuccess.refresh_token)
    );
  },
  signOut() {
    web3BrowserAuthProvider.isAuthenticated = false;
    localStorage.removeItem(web3AccessTokenKey);
    localStorage.removeItem(web3RefreshTokenKey);
    web3BrowserAuthProvider.triggerSignOutSubscriptions();
  },
  getAccessToken() {
    const result = localStorage.getItem(web3AccessTokenKey);
    if (!result) {
      return null;
    }

    return atob(result);
  },
  getRefreshToken() {
    const result = localStorage.getItem(web3RefreshTokenKey);

    if (!result) {
      return null;
    }

    return atob(result);
  },
  subscribeSignOut(callback: () => void) {
    web3BrowserAuthProvider.signOutCallback = callback;
  },
  unsubscribeSignOut() {
    web3BrowserAuthProvider.signOutCallback = () => undefined;
  },
  triggerSignOutSubscriptions() {
    web3BrowserAuthProvider.signOutCallback();
  },
};

export { web3BrowserAuthProvider };
