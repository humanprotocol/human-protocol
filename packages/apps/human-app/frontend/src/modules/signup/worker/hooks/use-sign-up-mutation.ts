import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { signupService } from '@/modules/signup/services/signup.service';
import { type SignUpDto } from '../schema';

export const SignUpSuccessResponseSchema = z.unknown();

export function useSignUpMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: Omit<SignUpDto, 'confirmPassword'>) => {
      return signupService.workerSignUp(data);
    },
    onSuccess: async (_, { email }) => {
      navigate(routerPaths.worker.verifyEmail, {
        state: { routerState: { email } },
      });
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
