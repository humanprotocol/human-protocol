import { useEffect } from 'react';
import { useSignInMutation } from '@/modules/worker/services/sign-in/sign-in';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import { type SignInDto } from '@/modules/worker/services/sign-in/types';

export function useSignIn() {
  const {
    mutate: signInWorkerMutate,
    error: signInWorkerError,
    isError: isSignInWorkerError,
    isPending: isSignInWorkerPending,
    reset: signInWorkerMutationReset,
  } = useSignInMutation();

  useEffect(() => {
    browserAuthProvider.signOut({ triggerSignOutSubscriptions: false });
  }, []);

  const handleWorkerSignIn = (data: SignInDto) => {
    signInWorkerMutate(data);
  };

  return {
    signIn: handleWorkerSignIn,
    error: signInWorkerError,
    isError: isSignInWorkerError,
    isLoading: isSignInWorkerPending,
    reset: signInWorkerMutationReset,
  };
}
