import {
  ResendEmailVerificationCommand,
  ResendEmailVerificationData,
  ResendEmailVerificationDto,
  ResendEmailVerificationParams,
} from '../model/resend-email-verification.model';
import {
  EmailVerificationCommand,
  EmailVerificationData,
  EmailVerificationDto,
} from '../model/email-verification.model';

const TOKEN = 'test_user_token';

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
  h_captcha_token: TOKEN,
};
export const resendEmailVerificationParamsFixture: ResendEmailVerificationParams =
  {
    hCaptchaToken: TOKEN,
  };
export const resendEmailVerificationCommandFixture: ResendEmailVerificationCommand =
  {
    data: resendEmailVerificationParamsFixture,
    token: TOKEN,
  };
export const resendEmailVerificationDataFixture: ResendEmailVerificationData = {
  h_captcha_token: TOKEN,
};
