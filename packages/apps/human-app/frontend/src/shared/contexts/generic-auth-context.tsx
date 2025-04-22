import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { type ZodType } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import { type AuthTokensSuccessResponse } from '@/shared/schemas';
import { type UserData } from '@/modules/auth/context/auth-context';
import { type Web3UserData } from '@/modules/auth-web3/context/web3-auth-context';
import { type AuthType } from '../types/browser-auth-provider';
import { useExpirationModal } from '../hooks';

export type AuthStatus = 'loading' | 'error' | 'success' | 'idle';

interface SignOutOptions {
  throwExpirationModal?: boolean;
  status?: AuthStatus;
}

interface AuthContextType<T> {
  status: AuthStatus;
  signOut: (options?: SignOutOptions) => void;
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
    const [authState, setAuthState] = useState<{
      user: T | null;
      status: AuthStatus;
    }>({
      user: null,
      status: 'loading',
    });
    const { openModal } = useExpirationModal();

    const displayExpirationModal = () => {
      queryClient.setDefaultOptions({ queries: { enabled: false } });
      openModal();
    };

    const handleSignIn = () => {
      try {
        const accessToken = browserAuthProvider.getAccessToken();
        const currentAuthType = browserAuthProvider.getAuthType();

        if (!accessToken || currentAuthType !== authType) {
          setAuthState({ user: null, status: 'idle' });
          return;
        }
        const userData = jwtDecode(accessToken);

        const validUserData = schema.parse(userData);

        setAuthState({ user: validUserData, status: 'success' });

        browserAuthProvider.signOutSubscription = displayExpirationModal;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Invalid JWT payload:', e);
        signOut({
          status: 'error',
        });
      }
    };

    const signIn = (signInSuccess: AuthTokensSuccessResponse) => {
      browserAuthProvider.signIn(signInSuccess, authType);
      handleSignIn();
    };

    const signOut = (options?: SignOutOptions) => {
      const { throwExpirationModal = true, status = 'idle' } = options ?? {};

      browserAuthProvider.signOut({
        triggerSignOutSubscriptions: throwExpirationModal,
      });
      setAuthState({ user: null, status });
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
