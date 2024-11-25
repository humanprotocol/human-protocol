/* eslint-disable camelcase -- ... */
import { useState, createContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import type { SignInSuccessResponse } from '@/api/services/worker/sign-in/types';
import { browserAuthProvider } from '@/shared/helpers/browser-auth-provider';
import { useModalStore } from '@/components/ui/modal/modal.store';

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
  signOut: (throwExpirationModal?: boolean) => void;
  signIn: (singIsSuccess: SignInSuccessResponse) => void;
  updateUserData: (updateUserDataPayload: UpdateUserDataPayload) => void;
}

interface UnauthenticatedUserContextType {
  user: null;
  status: AuthStatus;
  signOut: (throwExpirationModal?: boolean) => void;
  signIn: (singIsSuccess: SignInSuccessResponse) => void;
}

export const AuthContext = createContext<
  AuthenticatedUserContextType | UnauthenticatedUserContextType | null
>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { openModal } = useModalStore();
  const [authState, setAuthState] = useState<{
    user: UserData | null;
    status: AuthStatus;
  }>({ user: null, status: 'loading' });

  const displayExpirationModal = () => {
    queryClient.setDefaultOptions({ queries: { enabled: false } });
    openModal({
      modalState: 'EXPIRATION_MODAL',
      displayCloseButton: false,
      maxWidth: 'sm',
    });
  };

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
      browserAuthProvider.signOutSubscription = displayExpirationModal;
    } catch (e) {
      // eslint-disable-next-line no-console -- ...
      console.error('Invalid Jwt payload:', e);
      browserAuthProvider.signOut({ triggerSignOutSubscriptions: true });
      setAuthState({ user: null, status: 'error' });
    }
  };

  const signIn = (singIsSuccess: SignInSuccessResponse) => {
    browserAuthProvider.signIn(singIsSuccess, 'web2');
    handleSignIn();
  };

  const signOut = (throwExpirationModal = true) => {
    browserAuthProvider.signOut({
      triggerSignOutSubscriptions: throwExpirationModal,
    });
    setAuthState({ user: null, status: 'idle' });
  };

  useEffect(() => {
    handleSignIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
