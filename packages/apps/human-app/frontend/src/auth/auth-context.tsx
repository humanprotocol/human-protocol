import { useState, createContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { z } from 'zod';
import type { SignInSuccessResponse } from '@/api/servieces/worker/sign-in';
import { browserAuthProvider } from '@/shared/helpers/browser-auth-provider';

const userDataSchema = z.object({
  email: z.string(),
  userId: z.number(),
  address: z.string().nullable(),
  // eslint-disable-next-line camelcase -- camel case defined by api
  reputation_network: z.string(),
  // eslint-disable-next-line camelcase -- camel case defined by api
  kyc_status: z.string().optional().nullable(),
  // eslint-disable-next-line camelcase -- camel case defined by api
  kyc_added_on_chain: z.boolean().optional(), // TODO that should be verified when adding KYC info on chain feature is done
  // eslint-disable-next-line camelcase -- camel case defined by api
  email_notifications: z.boolean().optional(), // TODO that should be verified when email notifications feature is done
});

export type UserData = z.infer<typeof userDataSchema>;

type AuthStatus = 'loading' | 'error' | 'success' | 'idle';
export interface AuthenticatedUserContextType {
  user: UserData;
  status: AuthStatus;
  signOut: () => void;
  signIn: (singIsSuccess: SignInSuccessResponse) => void;
}

interface UnauthenticatedUserContextType {
  user: null;
  status: AuthStatus;
  signOut: () => void;
  signIn: (singIsSuccess: SignInSuccessResponse) => void;
}

export const AuthContext = createContext<
  AuthenticatedUserContextType | UnauthenticatedUserContextType | null
>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<{
    user: UserData | null;
    status: AuthStatus;
  }>({ user: null, status: 'loading' });

  const handleSignIn = () => {
    try {
      const accessToken = browserAuthProvider.getAccessToken();
      const authType = browserAuthProvider.getAuthType();

      if (!accessToken || authType !== 'web2') {
        setAuthState({ user: null, status: 'idle' });
        return;
      }
      const userData = jwtDecode(accessToken);
      const validUserData = userDataSchema.parse(userData);
      setAuthState({ user: validUserData, status: 'success' });
    } catch (e) {
      // eslint-disable-next-line no-console -- ...
      console.error('Invalid Jwt payload:', e);
      browserAuthProvider.signOut();
      setAuthState({ user: null, status: 'error' });
    }
  };

  const signIn = (singIsSuccess: SignInSuccessResponse) => {
    browserAuthProvider.signIn(singIsSuccess, 'web2');
    handleSignIn();
  };

  const signOut = () => {
    browserAuthProvider.signOut();
    setAuthState({ user: null, status: 'idle' });
  };

  useEffect(() => {
    handleSignIn();
  }, []);

  return (
    <AuthContext.Provider
      value={
        authState.user && authState.status === 'success'
          ? {
              ...authState,
              signOut,
              signIn,
            }
          : {
              ...authState,
              signOut,
              signIn,
            }
      }
    >
      {children}
    </AuthContext.Provider>
  );
}
