import type { UserData } from '@/modules/auth/context/auth-context';
import { type AuthTokensSuccessResponse } from '../schemas';

type SubscriptionCallback = () => void;
export interface BrowserAuthProvider {
  isAuthenticated: boolean;
  signIn: (
    singInSuccessData: AuthTokensSuccessResponse,
    signOutSubscription?: SubscriptionCallback
  ) => void;
  signOut: (args?: {
    callback?: () => void;
    triggerSignOutSubscriptions?: boolean;
  }) => void;
  signOutSubscription?: SubscriptionCallback;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setUserData: (userData: UserData) => void;
  getUserData: () => { data: unknown };
}
