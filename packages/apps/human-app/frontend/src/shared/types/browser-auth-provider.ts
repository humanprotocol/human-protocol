import type { SignInSuccessResponse } from '@/api/servieces/worker/sign-in';

export type AuthType = 'web2' | 'web3';

export interface BrowserAuthProvider {
  isAuthenticated: boolean;
  authType: AuthType;
  signOutCallback: () => void;
  signIn: (
    singInSuccessData: SignInSuccessResponse,
    authType: AuthType
  ) => void;
  signOut: () => void;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  getAuthType: () => string | null;
  subscribeSignOut: (callback: () => void) => void;
}
