import type { SignInSuccessResponse } from '@/api/servieces/worker/sign-in';
import type { UserData } from '@/auth/auth-context';

export type AuthType = 'web2' | 'web3';

export interface BrowserAuthProvider {
  isAuthenticated: boolean;
  authType: AuthType;
  signIn: (
    singInSuccessData: SignInSuccessResponse,
    authType: AuthType
  ) => void;
  signOut: (callback?: () => void) => void;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  getAuthType: () => string | null;
  setUserData: (userData: UserData) => void;
  getUserData: () => { data: unknown };
}
