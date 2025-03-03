export enum EmailAction {
  SIGNUP = 'signup',
  RESET_PASSWORD = 'reset_password',
  PASSWORD_CHANGED = 'password_changed',
}

export const SENDGRID_API_KEY_REGEX =
  /^SG\.[A-Za-z0-9-_]{22}\.[A-Za-z0-9-_]{43}$/;
