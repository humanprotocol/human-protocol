import { useState, createContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { ZodError, z } from 'zod';
import { t } from 'i18next';
import { browserAuthProvider } from '@/auth/browser-auth-provider';
import type { SignInSuccessResponse } from '@/api/servieces/worker/sign-in';

const userDataSchema = z.object({
  email: z.string(),
  userId: z.number(),
  address: z.string().nullable(),
  // eslint-disable-next-line camelcase -- camel case defined by api
  reputation_network: z.string(),
  // eslint-disable-next-line camelcase -- camel case defined by api
  kyc_status: z.enum(['APPROVED']).optional(),
});

type UserData = z.infer<typeof userDataSchema>;

type AuthStatus = 'loading' | 'idle';
export interface AuthenticatedUserContextType {
  user: UserData;
  userDataError: null;
  status: AuthStatus;
  signOut: () => void;
  signIn: (singIsSuccess: SignInSuccessResponse) => void;
}

interface UnauthenticatedUserContextType {
  user: null;
  userDataError: string | null;
  status: AuthStatus;
  signOut: () => void;
  signIn: (singIsSuccess: SignInSuccessResponse) => void;
}

export const AuthContext = createContext<
  AuthenticatedUserContextType | UnauthenticatedUserContextType | null
>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const handleSignIn = () => {
    try {
      const accessToken = browserAuthProvider.getAccessToken();
      if (!accessToken) {
        setStatus('idle');
        return;
      }
      const userData = jwtDecode(accessToken);
      const validUserData = userDataSchema.parse(userData);
      setUser(validUserData);
      setError(null);
      setStatus('idle');
    } catch (err) {
      browserAuthProvider.signOut();
      if (err instanceof ZodError) {
        setError(err.message);
      } else {
        setError(t('errors.unknown'));
      }
      setStatus('idle');
    }
  };

  const signIn = (singIsSuccess: SignInSuccessResponse) => {
    browserAuthProvider.signIn(singIsSuccess);
    handleSignIn();
  };

  const signOut = () => {
    browserAuthProvider.signOut();
    setUser(null);
    setError(null);
  };

  useEffect(() => {
    handleSignIn();
  }, []);

  return (
    <AuthContext.Provider
      value={
        user && !error
          ? {
              user,
              signOut,
              signIn,
              userDataError: null,
              status: 'idle',
            }
          : {
              user: null,
              signOut,
              signIn,
              userDataError: error,
              status,
            }
      }
    >
      {children}
    </AuthContext.Provider>
  );
}
