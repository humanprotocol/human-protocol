import type { SignInSuccessResponse } from '@/api/servieces/worker/sign-in';

export interface BrowserAuthProvider {
  isAuthenticated: boolean;
  signOutCallback: () => void;
  signIn: (singIsSuccess: SignInSuccessResponse) => void;
  signOut: () => void;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  subscribeSignOut: (callback: () => void) => void;
  unsubscribeSignOut: () => void;
  triggerSignOutSubscriptions: () => void;
}
