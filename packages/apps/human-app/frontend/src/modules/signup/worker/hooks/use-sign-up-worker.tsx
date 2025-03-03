import { useEffect } from 'react';
import omit from 'lodash/omit';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import type { SignUpDto } from '@/modules/worker/services/sign-up';
import { useSignUpMutation } from '@/modules/worker/services/sign-up';

export function useSignUpWorker() {
  const {
    mutate: signUpWorkerMutate,
    error: signUpWorkerError,
    isError: isSignUpWorkerError,
    isPending: isSignUpWorkerPending,
    reset: signUpWorkerMutationReset,
  } = useSignUpMutation();

  useEffect(() => {
    browserAuthProvider.signOut({ triggerSignOutSubscriptions: false });
  }, []);

  const handleWorkerSignUp = (data: SignUpDto) => {
    signUpWorkerMutate(omit(data, ['confirmPassword']));
  };

  return {
    signUp: handleWorkerSignUp,
    error: signUpWorkerError,
    isError: isSignUpWorkerError,
    isLoading: isSignUpWorkerPending,
    reset: signUpWorkerMutationReset,
  };
}
