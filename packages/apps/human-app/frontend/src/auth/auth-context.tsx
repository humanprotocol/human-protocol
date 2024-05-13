import { useState, createContext, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
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
  // eslint-disable-next-line camelcase -- camel case defined by api
  kyc_added_on_chain: z.boolean().optional(), // TODO that should be verified when adding KYC info on chain feature is done
  // eslint-disable-next-line camelcase -- camel case defined by api
  email_notifications: z.boolean().optional(), // TODO that should be verified when email notifications feature is done
});

type UserData = z.infer<typeof userDataSchema>;

export interface AuthenticatedUserContextType {
  user: UserData;
  isUserDataError: false;
  signOut: () => void;
  signIn: (singIsSuccess: SignInSuccessResponse) => void;
  isPending: false;
}

interface UnauthenticatedUserContextType {
  user: null;
  isUserDataError: boolean;
  userDataError: unknown;
  signOut: () => void;
  signIn: (singIsSuccess: SignInSuccessResponse) => void;
  isPending: boolean;
}

export const AuthContext = createContext<
  AuthenticatedUserContextType | UnauthenticatedUserContextType | null
>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const signOutSubscription = useCallback(() => {
    setUser(null);
  }, []);

  const { data, isPending, isError, refetch, error } = useQuery({
    queryFn: () => {
      const accessToken = browserAuthProvider.getAccessToken();
      if (!accessToken) {
        return;
      }
      const userData = jwtDecode(accessToken);
      const validUserData = userDataSchema.parse(userData);
      browserAuthProvider.subscribeSignOut(signOutSubscription);
      return { accessToken, userData: validUserData };
    },
    queryKey: [
      'singIn',
      browserAuthProvider.getAccessToken(),
      user,
      signOutSubscription,
    ],
  });

  const signIn = (singIsSuccess: SignInSuccessResponse) => {
    browserAuthProvider.signIn(singIsSuccess);
    void refetch();
  };

  const signOut = () => {
    browserAuthProvider.signOut();
    void refetch();
  };

  return (
    <AuthContext.Provider
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
    </AuthContext.Provider>
  );
}
