import type { SignInSuccessResponse } from '@/api/services/worker/sign-in';
import type { Web3UserData } from '@/auth-web3/web3-auth-context';
import type { UserData } from '@/auth/auth-context';

export type AuthType = 'web2' | 'web3';
type SubscriptionCallback = () => void;
export interface BrowserAuthProvider {
  isAuthenticated: boolean;
  authType: AuthType;
  signIn: (
    singInSuccessData: SignInSuccessResponse,
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
  getAuthType: () => string | null;
  setUserData: (userData: UserData | Web3UserData) => void;
  getUserData: () => { data: unknown };
}
