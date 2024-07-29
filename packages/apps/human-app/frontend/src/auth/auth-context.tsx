/* eslint-disable camelcase -- ... */
import { useState, createContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { z } from 'zod';
import type { SignInSuccessResponse } from '@/api/servieces/worker/sign-in';
import { browserAuthProvider } from '@/shared/helpers/browser-auth-provider';

const extendableUserDataSchema = z.object({
  site_key: z.string().optional().nullable(),
  kyc_status: z.string().optional().nullable(),
  wallet_address: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
});

const userDataSchema = z
  .object({
    email: z.string(),
    userId: z.number(),
    reputation_network: z.string(),
    email_notifications: z.boolean().optional(), // TODO that should be verified when email notifications feature is done
    exp: z.number(),
  })
  .merge(extendableUserDataSchema);

export type UserData = z.infer<typeof userDataSchema>;
export type UpdateUserDataPayload = z.infer<typeof extendableUserDataSchema>;

type AuthStatus = 'loading' | 'error' | 'success' | 'idle';
export interface AuthenticatedUserContextType {
  user: UserData;
  status: AuthStatus;
  signOut: () => void;
  signIn: (singIsSuccess: SignInSuccessResponse) => void;
  updateUserData: (updateUserDataPayload: UpdateUserDataPayload) => void;
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
  const updateUserData = (updateUserDataPayload: UpdateUserDataPayload) => {
    setAuthState((state) => {
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
      const savedUserData = browserAuthProvider.getUserData();

      if (!accessToken || authType !== 'web2') {
        setAuthState({ user: null, status: 'idle' });
        return;
      }
      const userData = jwtDecode(accessToken);
      const userDataWithSavedData = savedUserData.data
        ? { ...userData, ...savedUserData.data }
        : userData;

      const validUserData = userDataSchema.parse(userDataWithSavedData);
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
              user: authState.user,
              status: authState.status,
              signOut,
              signIn,
              updateUserData,
            }
          : {
              user: null,
              status: authState.status,
              signOut,
              signIn,
            }
      }
    >
      {children}
    </AuthContext.Provider>
  );
}
