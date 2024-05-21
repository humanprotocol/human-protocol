/* eslint-disable camelcase -- ...*/
import { useState, createContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { z } from 'zod';
import type { SignInSuccessResponse } from '@/api/servieces/worker/sign-in';
import { web3BrowserAuthProvider } from '@/auth-web3/web3-browser-auth-provider';

const web3userDataSchema = z.object({
  userId: z.number(),
  address: z.string(),
  reputation_network: z.string(),
});

type Web3UserData = z.infer<typeof web3userDataSchema>;

type AuthStatus = 'loading' | 'error' | 'success' | 'idle';
export interface Web3AuthenticatedUserContextType {
  user: Web3UserData;
  status: AuthStatus;
  signOut: () => void;
  signIn: (singIsSuccess: SignInSuccessResponse) => void;
}

interface Web3UnauthenticatedUserContextType {
  user: null;
  status: AuthStatus;
  signOut: () => void;
  signIn: (singIsSuccess: SignInSuccessResponse) => void;
}

export const Web3AuthContext = createContext<
  Web3AuthenticatedUserContextType | Web3UnauthenticatedUserContextType | null
>(null);

export function Web3AuthProvider({ children }: { children: React.ReactNode }) {
  const [web3AuthState, setWeb3AuthState] = useState<{
    user: Web3UserData | null;
    status: AuthStatus;
  }>({ user: null, status: 'loading' });

  // TODO update SignInSuccessResponse according to new endpoint web3/auth/signin
  const handleSignIn = () => {
    try {
      const accessToken = web3BrowserAuthProvider.getAccessToken();
      if (!accessToken) {
        setWeb3AuthState({ user: null, status: 'idle' });
        return;
      }
      const userData = jwtDecode(accessToken);
      const validUserData = web3userDataSchema.parse(userData);
      setWeb3AuthState({ user: validUserData, status: 'success' });
      web3BrowserAuthProvider.subscribeSignOut(() => {
        setWeb3AuthState({ user: null, status: 'idle' });
      });
    } catch (e) {
      // eslint-disable-next-line no-console -- ...
      console.error('Invalid Jwt payload:', e);
      web3BrowserAuthProvider.signOut();
      setWeb3AuthState({ user: null, status: 'error' });
    }
  };
  // TODO correct interface of singIsSuccess from auth/web3/signin
  const signIn = (singIsSuccess: SignInSuccessResponse) => {
    web3BrowserAuthProvider.signIn(singIsSuccess);
    handleSignIn();
  };

  const signOut = () => {
    setWeb3AuthState({ user: null, status: 'idle' });
  };

  useEffect(() => {
    handleSignIn();
  }, []);

  return (
    <Web3AuthContext.Provider
      value={
        web3AuthState.user && web3AuthState.status === 'success'
          ? {
              ...web3AuthState,
              signOut,
              signIn,
            }
          : {
              ...web3AuthState,
              signOut,
              signIn,
            }
      }
    >
      {children}
    </Web3AuthContext.Provider>
  );
}
