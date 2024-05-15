import { useState, createContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { ZodError, z } from 'zod';
import { t } from 'i18next';
import type { SignInSuccessResponse } from '@/api/servieces/worker/sign-in';
import { web3browserAuthProvider } from '@/auth-web3/web3-browser-auth-provider';

const web3userDataSchema = z.object({
  // TODO add valid schema that defines JWT payload
  address: z.string().nullable().optional(),
});

type Web3UserData = z.infer<typeof web3userDataSchema>;

type AuthStatus = 'loading' | 'idle';
export interface Web3AuthenticatedUserContextType {
  user: Web3UserData;
  userDataError: null;
  status: AuthStatus;
  signOut: () => void;
  signIn: (singIsSuccess: SignInSuccessResponse) => void;
}

interface Web3UnauthenticatedUserContextType {
  user: null;
  userDataError: string | null;
  status: AuthStatus;
  signOut: () => void;
  signIn: (singIsSuccess: SignInSuccessResponse) => void;
}

export const Web3AuthContext = createContext<
  Web3AuthenticatedUserContextType | Web3UnauthenticatedUserContextType | null
>(null);

export function Web3AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Web3UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // TODO update SignInSuccessResponse according to new endpoint web3/auth/signin
  const handleSignIn = () => {
    try {
      const accessToken = web3browserAuthProvider.getAccessToken();
      if (!accessToken) {
        setStatus('idle');
        return;
      }
      const userData = jwtDecode(accessToken);
      const validUserData = web3userDataSchema.parse(userData);
      setUser(validUserData);
      setError(null);
      setStatus('idle');
    } catch (err) {
      web3browserAuthProvider.signOut();
      if (err instanceof ZodError) {
        setError(err.message);
      } else {
        setError(t('errors.unknown'));
      }
      setStatus('idle');
    }
  };
  // TODO correct interface of singIsSuccess from auth/web3/signin
  const signIn = (singIsSuccess: SignInSuccessResponse) => {
    web3browserAuthProvider.signIn(singIsSuccess);
    handleSignIn();
  };

  const signOut = () => {
    web3browserAuthProvider.signOut();
    setUser(null);
    setError(null);
  };

  useEffect(() => {
    handleSignIn();
  }, []);

  return (
    <Web3AuthContext.Provider
      value={
        user && !error
          ? {
              user,
              signOut,
              signIn,
              userDataError: null,
              status,
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
    </Web3AuthContext.Provider>
  );
}
