import { useState, createContext, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import type { SignInSuccessResponse } from '@/api/servieces/worker/sign-in';
import { web3browserAuthProvider } from '@/auth-web3/web3-browser-auth-provider';

const web3userDataSchema = z.unknown();

type Web3UserData = z.infer<typeof web3userDataSchema>;

export interface Web3AuthenticatedUserContextType {
  user: Web3UserData;
  isUserDataError: false;
  signOut: () => void;
  signIn: (singIsSuccess: SignInSuccessResponse) => void;
  isPending: false;
}

interface Web3UnauthenticatedUserContextType {
  user: null;
  isUserDataError: boolean;
  userDataError: unknown;
  signOut: () => void;
  signIn: (singIsSuccess: SignInSuccessResponse) => void;
  isPending: boolean;
}

export const Web3AuthContext = createContext<
  Web3AuthenticatedUserContextType | Web3UnauthenticatedUserContextType | null
>(null);

export function Web3AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Web3UserData>(null);
  const signOutSubscription = useCallback(() => {
    setUser(null);
  }, []);

  const { data, isPending, isError, refetch, error } = useQuery({
    queryFn: () => {
      const accessToken = web3browserAuthProvider.getAccessToken();
      if (!accessToken) {
        return;
      }
      const userData = jwtDecode(accessToken);
      const validUserData = web3userDataSchema.parse(userData);
      web3browserAuthProvider.subscribeSignOut(signOutSubscription);
      return { accessToken, userData: validUserData };
    },
    queryKey: [
      'singIn',
      web3browserAuthProvider.getAccessToken(),
      user,
      signOutSubscription,
    ],
  });

  const signIn = (singIsSuccess: SignInSuccessResponse) => {
    web3browserAuthProvider.signIn(singIsSuccess);
    void refetch();
  };

  const signOut = () => {
    web3browserAuthProvider.signOut();
    void refetch();
  };

  return (
    <Web3AuthContext.Provider
      value={
        data?.userData && !isError
          ? {
              user: data.userData,
              signOut,
              signIn,
              isUserDataError: false,
              isPending: false,
            }
          : {
              user: null,
              signOut,
              signIn,
              isUserDataError: isError,
              userDataError: error,
              isPending,
            }
      }
    >
      {children}
    </Web3AuthContext.Provider>
  );
}
