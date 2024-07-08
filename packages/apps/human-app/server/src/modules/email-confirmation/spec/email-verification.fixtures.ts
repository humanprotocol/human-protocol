import {
  ResendEmailVerificationCommand, ResendEmailVerificationData,
  ResendEmailVerificationDto,
  ResendEmailVerificationParams,
} from '../model/resend-email-verification.model';
import {
  EmailVerificationCommand, EmailVerificationData,
  EmailVerificationDto,
} from '../model/email-verification.model';

const TOKEN = 'test_user_token';
const EMAIL = 'test_user@email.com';

export const emailVerificationDtoFixture: EmailVerificationDto = {
  token: TOKEN,
};
export const emailVerificationCommandFixture: EmailVerificationCommand = {
  token: TOKEN,
};

export const emailVerificationDataFixture: EmailVerificationData = {
  token: TOKEN,
};

export const emailVerificationToken = TOKEN;
export const resendEmailVerificationDtoFixture: ResendEmailVerificationDto = {
  email: EMAIL,
  h_captcha_token: TOKEN,
};
export const resendEmailVerificationParamsFixture: ResendEmailVerificationParams =
  {
    email: EMAIL,
    hCaptchaToken: TOKEN,
  };
export const resendEmailVerificationCommandFixture: ResendEmailVerificationCommand =
  {
    data: resendEmailVerificationParamsFixture,
    token: TOKEN,
  };
export const resendEmailVerificationDataFixture: ResendEmailVerificationData = {
  email: EMAIL,
  h_captcha_token: TOKEN,
};
