/* eslint-disable camelcase -- ...*/
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useResendEmailVerificationWorkerMutation,
  resendEmailVerificationHcaptchaSchema,
} from '@/modules/worker/services/resend-email-verification';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';
import type { ResendEmailVerificationDto } from '@/modules/worker/services/resend-email-verification';

export function useResendEmail(email: string) {
  const {
    isError,
    error,
    isSuccess,
    mutate: resendEmailVerificationMutation,
    reset: resendEmailVerificationMutationReset,
  } = useResendEmailVerificationWorkerMutation();
  const methods = useForm<Pick<ResendEmailVerificationDto, 'h_captcha_token'>>({
    defaultValues: {
      h_captcha_token: '',
    },
    resolver: zodResolver(resendEmailVerificationHcaptchaSchema),
  });

  useResetMutationErrors(methods.watch, resendEmailVerificationMutationReset);

  const handleResend = (
    data: Pick<ResendEmailVerificationDto, 'h_captcha_token'>
  ) => {
    if (!email) {
      return;
    }

    resendEmailVerificationMutation({
      email,
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
