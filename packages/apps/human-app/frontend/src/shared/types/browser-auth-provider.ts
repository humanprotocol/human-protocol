import type { Web3UserData } from '@/modules/auth-web3/context/web3-auth-context';
import type { UserData } from '@/modules/auth/context/auth-context';
import { type AuthTokensSuccessResponse } from '../schemas';

export type AuthType = 'web2' | 'web3';
type SubscriptionCallback = () => void;
export interface BrowserAuthProvider {
  isAuthenticated: boolean;
  authType: AuthType;
  signIn: (
    singInSuccessData: AuthTokensSuccessResponse,
    authType: AuthType,
    signOutSubscription?: SubscriptionCallback
  ) => void;
  signOut: (args?: {
    callback?: () => void;
    triggerSignOutSubscriptions?: boolean;
  }) => void;
  signOutSubscription?: SubscriptionCallback;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  getAuthType: () => AuthType | null;
  setUserData: (userData: UserData | Web3UserData) => void;
  getUserData: () => { data: unknown };
}
