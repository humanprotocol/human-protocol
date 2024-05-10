import type { SignInSuccessResponse } from '@/api/servieces/worker/sign-in';

const web3accessTokenKey = btoa('web3_access_token');

const web3browserAuthProvider = {
  isAuthenticated: false,
  signOutCallbacks: [] as (() => void)[],
  signIn(singIsSuccess: SignInSuccessResponse) {
    web3browserAuthProvider.isAuthenticated = true;
    localStorage.setItem(web3accessTokenKey, btoa(singIsSuccess.access_token));
  },
  signOut() {
    web3browserAuthProvider.isAuthenticated = false;
    localStorage.removeItem(web3accessTokenKey);
    web3browserAuthProvider.triggerSignOutSubscriptions();
  },
  getAccessToken() {
    const result = localStorage.getItem(web3accessTokenKey);

    if (!result) {
      return null;
    }

    return atob(result);
  },
  getRefreshToken() {
    const result = localStorage.getItem(web3accessTokenKey);

    if (!result) {
      return null;
    }

    return atob(result);
  },
  subscribeSignOut(callback: () => void) {
    web3browserAuthProvider.signOutCallbacks.push(callback);
  },
  unsubscribeSignOut() {
    web3browserAuthProvider.signOutCallbacks = [];
  },
  triggerSignOutSubscriptions() {
    web3browserAuthProvider.signOutCallbacks.forEach((callback) => {
      callback();
    });
  },
};

export { web3browserAuthProvider };
