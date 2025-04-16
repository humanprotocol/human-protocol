// generic-auth-provider.tsx
import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { type ZodType } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import {
  ModalType,
  useModalStore,
} from '@/shared/components/ui/modal/modal.store';
import { type AuthTokensSuccessResponse } from '@/shared/schemas';
import { type UserData } from '@/modules/auth/context/auth-context';
import { type Web3UserData } from '@/modules/auth-web3/context/web3-auth-context';
import { type AuthType } from '../types/browser-auth-provider';

export type AuthStatus = 'loading' | 'error' | 'success' | 'idle';

interface AuthContextType<T> {
  status: AuthStatus;
  signOut: (throwExpirationModal?: boolean) => void;
  signIn: (signInSuccess: AuthTokensSuccessResponse) => void;
  updateUserData: (update: Partial<T>) => void;
}

export interface AuthenticatedUserContextType<T> extends AuthContextType<T> {
  user: T;
}

export interface UnauthenticatedUserContextType<T> extends AuthContextType<T> {
  user: null;
}

export function createAuthProvider<T extends UserData | Web3UserData>(config: {
  authType: AuthType;
  schema: ZodType<T>;
}) {
  const { authType, schema } = config;
  const AuthContext = createContext<
    AuthenticatedUserContextType<T> | UnauthenticatedUserContextType<T> | null
  >(null);

  function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const queryClient = useQueryClient();
    const { openModal } = useModalStore();
    const [authState, setAuthState] = useState<{
      user: T | null;
      status: AuthStatus;
    }>({
      user: null,
      status: 'loading',
    });

    const displayExpirationModal = () => {
      queryClient.setDefaultOptions({ queries: { enabled: false } });
      openModal({
        modalType: ModalType.EXPIRATION_MODAL,
        displayCloseButton: false,
        maxWidth: 'sm',
      });
    };

    const handleSignIn = () => {
      try {
        const accessToken = browserAuthProvider.getAccessToken();
        const currentAuthType = browserAuthProvider.getAuthType();
        const savedUserData = browserAuthProvider.getUserData();

        if (!accessToken || currentAuthType !== authType) {
          setAuthState({ user: null, status: 'idle' });
          return;
        }
        const userData = jwtDecode(accessToken);
        const userDataWithSavedData = savedUserData.data
          ? { ...userData, ...savedUserData.data }
          : userData;

        const validUserData = schema.parse(userDataWithSavedData);

        setAuthState({ user: validUserData, status: 'success' });
        // Set the expiration modal callback
        browserAuthProvider.signOutSubscription = displayExpirationModal;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Invalid JWT payload:', e);
        browserAuthProvider.signOut({ triggerSignOutSubscriptions: true });
        setAuthState({ user: null, status: 'error' });
      }
    };

    const signIn = (signInSuccess: AuthTokensSuccessResponse) => {
      browserAuthProvider.signIn(signInSuccess, authType);
      handleSignIn();
    };

    const signOut = (throwExpirationModal = true) => {
      browserAuthProvider.signOut({
        triggerSignOutSubscriptions: throwExpirationModal,
      });
      setAuthState({ user: null, status: 'idle' });
    };

    const updateUserData = (update: Partial<T>) => {
      setAuthState((prev) => {
        if (!prev.user) return prev;
        const newUserData = { ...prev.user, ...update };
        browserAuthProvider.setUserData(newUserData);
        return { ...prev, user: newUserData };
      });
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
                signIn,
                signOut,
                updateUserData,
              }
            : {
                user: null,
                status: authState.status,
                signIn,
                signOut,
                updateUserData,
              }
        }
      >
        {children}
      </AuthContext.Provider>
    );
  }

  return { AuthContext, AuthProvider };
}
