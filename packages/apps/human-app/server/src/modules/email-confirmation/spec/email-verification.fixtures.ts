import {
  ResendEmailVerificationCommand,
  ResendEmailVerificationDto,
  ResendEmailVerificationParams,
} from '../model/resend-email-verification.model';

const TOKEN = 'test_user_token';
const EMAIL = 'test_user@email.com';

export const emailVerificationToken = TOKEN;
export const resendEmailVerificationDtoFixture: ResendEmailVerificationDto = {
  email: EMAIL,
};
export const resendEmailVerificationParamsFixture: ResendEmailVerificationParams =
  {
    email: EMAIL,
  };
export const resendEmailVerificationCommandFixture: ResendEmailVerificationCommand =
  {
    data: resendEmailVerificationParamsFixture,
    token: TOKEN,
  };
