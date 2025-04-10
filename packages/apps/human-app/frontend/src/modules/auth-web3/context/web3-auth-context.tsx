/* eslint-disable camelcase -- ...*/
import { useState, createContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import {
  ModalType,
  useModalStore,
} from '@/shared/components/ui/modal/modal.store';
import { type AuthTokensSuccessResponse } from '@/shared/schemas';

export enum OperatorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

const web3userDataSchema = z.object({
  user_id: z.number(),
  wallet_address: z.string(),
  reputation_network: z.string(),
  operator_status: z.nativeEnum(OperatorStatus),
  exp: z.number(),
  status: z.literal('active'),
});

export type Web3UserData = z.infer<typeof web3userDataSchema>;

type AuthStatus = 'loading' | 'error' | 'success' | 'idle';
export interface Web3AuthenticatedUserContextType {
  user: Web3UserData;
  status: AuthStatus;
  signOut: (throwExpirationModal?: boolean) => void;
  signIn: (singIsSuccess: AuthTokensSuccessResponse) => void;
  updateUserData: (updateUserDataPayload: Partial<Web3UserData>) => void;
}

interface Web3UnauthenticatedUserContextType {
  user: null;
  status: AuthStatus;
  signOut: (throwExpirationModal?: boolean) => void;
  signIn: (singIsSuccess: AuthTokensSuccessResponse) => void;
}

export const Web3AuthContext = createContext<
  Web3AuthenticatedUserContextType | Web3UnauthenticatedUserContextType | null
>(null);

export function Web3AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { openModal } = useModalStore();
  const [web3AuthState, setWeb3AuthState] = useState<{
    user: Web3UserData | null;
    status: AuthStatus;
  }>({ user: null, status: 'loading' });

  const displayExpirationModal = () => {
    queryClient.setDefaultOptions({ queries: { enabled: false } });
    openModal({
      modalType: ModalType.EXPIRATION_MODAL,
      displayCloseButton: false,
      maxWidth: 'sm',
    });
  };

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
      browserAuthProvider.signOutSubscription = displayExpirationModal;
    } catch (e) {
      // eslint-disable-next-line no-console -- ...
      console.error('Invalid Jwt payload:', e);
      browserAuthProvider.signOut({ triggerSignOutSubscriptions: true });
      setWeb3AuthState({ user: null, status: 'error' });
    }
  };

  const signIn = (singIsSuccess: AuthTokensSuccessResponse) => {
    browserAuthProvider.signIn(singIsSuccess, 'web3');
    handleSignIn();
  };

  const signOut = (throwExpirationModal = true) => {
    browserAuthProvider.signOut({
      triggerSignOutSubscriptions: throwExpirationModal,
    });

    setWeb3AuthState({ user: null, status: 'idle' });
  };

  useEffect(() => {
    handleSignIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
