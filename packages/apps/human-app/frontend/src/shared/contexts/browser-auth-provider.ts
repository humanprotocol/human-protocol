/* eslint-disable camelcase -- ...*/
import type {
  AuthType,
  BrowserAuthProvider,
} from '@/shared/types/browser-auth-provider';
import { type AuthTokensSuccessResponse } from '../schemas';

const accessTokenKey = 'ro_access_token';
const refreshTokenKey = 'ro_refresh_token';
const authTypeKey = 'ro_auth_type';
const userDataKey = 'ro_extendable_user_data';

const browserAuthProvider: BrowserAuthProvider = {
  isAuthenticated: false,
  authType: 'web2',
  signOutSubscription: undefined,

  signIn(
    { access_token, refresh_token }: AuthTokensSuccessResponse,
    authType,
    signOutSubscription
  ) {
    browserAuthProvider.isAuthenticated = true;
    browserAuthProvider.authType = authType;
    localStorage.setItem(accessTokenKey, access_token);
    localStorage.setItem(refreshTokenKey, refresh_token);
    localStorage.setItem(authTypeKey, authType);

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

  getAccessToken() {
    const accessToken = localStorage.getItem(accessTokenKey);

    if (!accessToken) {
      return null;
    }

    return accessToken;
  },

  getRefreshToken() {
    const refreshToken = localStorage.getItem(refreshTokenKey);

    if (!refreshToken) {
      return null;
    }

    return refreshToken;
  },

  getAuthType(): AuthType | null {
    const authType = localStorage.getItem(authTypeKey);

    if (!authType) {
      return null;
    }

    return authType as AuthType;
  },

  setUserData(userData) {
    localStorage.setItem(userDataKey, JSON.stringify(userData));
  },

  getUserData() {
    const userData = localStorage.getItem(userDataKey);

    if (!userData) {
      return { data: {} as unknown };
    }

    try {
      return {
        data: JSON.parse(userData) as unknown,
      };
    } catch (error) {
      return { data: {} as unknown };
    }
  },
};

export { browserAuthProvider };
