/* eslint-disable camelcase -- ...*/
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';
import {
  type ResendEmailVerificationDto,
  resendEmailVerificationHcaptchaSchema,
} from '../schemas';
import { useResendEmailVerificationWorkerMutation } from './resend-email-verification';

export function useResendEmail() {
  const {
    isError,
    error,
    isSuccess,
    mutate: resendEmailVerificationMutation,
    reset: resendEmailVerificationMutationReset,
  } = useResendEmailVerificationWorkerMutation();
  const methods = useForm<ResendEmailVerificationDto>({
    defaultValues: {
      h_captcha_token: 'token',
    },
    resolver: zodResolver(resendEmailVerificationHcaptchaSchema),
  });

  useResetMutationErrors(methods.watch, resendEmailVerificationMutationReset);

  const handleResend = (data: ResendEmailVerificationDto) => {
    resendEmailVerificationMutation({
      h_captcha_token: data.h_captcha_token,
    });
  };

  return {
    isError,
    isSuccess,
    error,
    methods,
    handleResend,
  };
}
