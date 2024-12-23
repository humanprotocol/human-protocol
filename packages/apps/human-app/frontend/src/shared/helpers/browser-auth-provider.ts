/* eslint-disable camelcase -- ...*/
import { type SignInSuccessResponse } from '@/api/services/worker/sign-in/types';
import type { BrowserAuthProvider } from '@/shared/types/browser-auth-provider';

const accessTokenKey = btoa('access_token');
const refreshTokenKey = btoa('refresh_token');
const authTypeKey = btoa('auth_type');
const userDataKey = btoa('extendable_user_data');

const browserAuthProvider: BrowserAuthProvider = {
  isAuthenticated: false,
  authType: 'web2',
  signIn(
    { access_token, refresh_token }: SignInSuccessResponse,
    authType,
    signOutSubscription
  ) {
    browserAuthProvider.isAuthenticated = true;
    browserAuthProvider.authType = authType;
    localStorage.setItem(accessTokenKey, btoa(access_token));
    localStorage.setItem(refreshTokenKey, btoa(refresh_token));
    localStorage.setItem(authTypeKey, btoa(authType));

    if (signOutSubscription) {
      this.signOutSubscription = signOutSubscription;
    }
  },
  signOut(args) {
    browserAuthProvider.isAuthenticated = false;
    localStorage.removeItem(accessTokenKey);
    localStorage.removeItem(refreshTokenKey);
    localStorage.removeItem(authTypeKey);
    localStorage.removeItem(userDataKey);

    if (args?.callback) {
      args.callback();
    }

    if (args?.triggerSignOutSubscriptions && this.signOutSubscription) {
      this.signOutSubscription();
      this.signOutSubscription = undefined;
    }
  },
  signOutSubscription: undefined,
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
  setUserData(userData) {
    localStorage.setItem(userDataKey, btoa(JSON.stringify(userData)));
  },
  getUserData() {
    const userData = localStorage.getItem(userDataKey);

    if (!userData) {
      return { data: {} as unknown };
    }

    try {
      return {
        data: JSON.parse(atob(userData)) as unknown,
      };
    } catch (error) {
      return { data: {} as unknown };
    }
  },
};

export { browserAuthProvider };
