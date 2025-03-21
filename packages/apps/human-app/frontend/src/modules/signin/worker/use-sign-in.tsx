import { useEffect } from 'react';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import { useSignInMutation } from './use-sign-in-mutation';
import { type SignInDto } from './schemas';

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
