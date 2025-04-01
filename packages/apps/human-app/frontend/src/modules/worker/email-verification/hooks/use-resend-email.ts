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
