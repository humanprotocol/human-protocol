/* eslint-disable camelcase -- ...*/
import { useState, createContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { z } from 'zod';
import type { SignInSuccessResponse } from '@/api/servieces/worker/sign-in';
import { browserAuthProvider } from '@/shared/helpers/browser-auth-provider';

const web3userDataSchema = z.object({
  userId: z.number(),
  wallet_address: z.string(),
  reputation_network: z.string(),
  exp: z.number(),
  status: z.string().nullable().optional(),
});

export type Web3UserData = z.infer<typeof web3userDataSchema>;

type AuthStatus = 'loading' | 'error' | 'success' | 'idle';
export interface Web3AuthenticatedUserContextType {
  user: Web3UserData;
  status: AuthStatus;
  signOut: () => void;
  signIn: (singIsSuccess: SignInSuccessResponse) => void;
  updateUserData: (updateUserDataPayload: Partial<Web3UserData>) => void;
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
  const updateUserData = (updateUserDataPayload: Partial<Web3UserData>) => {
    setWeb3AuthState((state) => {
      if (!state.user) {
        return state;
      }

      const newUserData = {
        ...state.user,
        ...updateUserDataPayload,
      };
      browserAuthProvider.setUserData(newUserData);

      return {
        ...state,
        user: newUserData,
      };
    });
  };

  const handleSignIn = () => {
    try {
      const accessToken = browserAuthProvider.getAccessToken();
      const authType = browserAuthProvider.getAuthType();

      if (!accessToken || authType !== 'web3') {
        setWeb3AuthState({ user: null, status: 'idle' });
        return;
      }
      const userData = jwtDecode(accessToken);
      const validUserData = web3userDataSchema.parse(userData);
      setWeb3AuthState({ user: validUserData, status: 'success' });
    } catch (e) {
      // eslint-disable-next-line no-console -- ...
      console.error('Invalid Jwt payload:', e);
      browserAuthProvider.signOut();
      setWeb3AuthState({ user: null, status: 'error' });
    }
  };
  // TODO correct interface of singIsSuccess from auth/web3/signing
  const signIn = (singIsSuccess: SignInSuccessResponse) => {
    browserAuthProvider.signIn(singIsSuccess, 'web3');
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
              user: web3AuthState.user,
              status: web3AuthState.status,
              signOut,
              signIn,
              updateUserData,
            }
          : {
              user: null,
              status: web3AuthState.status,
              signOut,
              signIn,
            }
      }
    >
      {children}
    </Web3AuthContext.Provider>
  );
}
