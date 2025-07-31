import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import * as signupService from '@/modules/signup/services/signup.service';
import { type SignUpDto } from '../schema';

export function useSignUpMutation() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: Omit<SignUpDto, 'confirmPassword'>) => {
      return signupService.workerSignUp(data);
    },
    onSuccess: (_, { email }) => {
      navigate(routerPaths.worker.verifyEmail, {
        state: { routerState: { email } },
      });
    },
  });
}
