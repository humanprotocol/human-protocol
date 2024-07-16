import {
  ForgotPasswordCommand,
  ForgotPasswordData,
  ForgotPasswordDto,
} from '../model/forgot-password.model';
import {
  RestorePasswordCommand,
  RestorePasswordData,
  RestorePasswordDto,
} from '../model/restore-password.model';

const EMAIL = 'test_user@email.com';
const TOKEN = 'test_user_token';
const PASSWORD = 'test_password_A1!';
const H_CAPTCHA_TOKEN = 'test_captcha_token';

export const forgotPasswordDtoFixture: ForgotPasswordDto = {
  email: EMAIL,
  h_captcha_token: H_CAPTCHA_TOKEN,
};

export const forgotPasswordCommandFixture: ForgotPasswordCommand = {
  email: EMAIL,
  hCaptchaToken: H_CAPTCHA_TOKEN,
};

export const forgotPasswordDataFixture: ForgotPasswordData = {
  email: EMAIL,
  h_captcha_token: H_CAPTCHA_TOKEN,
};

export const restorePasswordDtoFixture: RestorePasswordDto = {
  password: PASSWORD,
  token: TOKEN,
  h_captcha_token: H_CAPTCHA_TOKEN,
};

export const restorePasswordCommandFixture: RestorePasswordCommand = {
  password: PASSWORD,
  token: TOKEN,
  hCaptchaToken: H_CAPTCHA_TOKEN,
};

export const restorePasswordDataFixture: RestorePasswordData = {
  password: PASSWORD,
  token: TOKEN,
  hCaptchaToken: H_CAPTCHA_TOKEN,
};
