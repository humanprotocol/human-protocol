import { BaseError } from '../../common/errors/base';

export enum AuthErrorMessage {
  INVALID_CREDENTIALS = 'Invalid email or password',
  INVALID_REFRESH_TOKEN = 'Refresh token is not valid',
  REFRESH_TOKEN_EXPIRED = 'Refresh token expired',
  PASSWORD_TOKEN_EXPIRED = 'Password token expired',
  INVALID_PASSWORD_TOKEN = 'Password token is not valid',
  EMAIL_TOKEN_EXPIRED = 'Email token expired',
  INVALID_EMAIL_TOKEN = 'Email token is not valid',
  INVALID_WEB3_SIGNATURE = 'Invalid signature',
  INVALID_ADDRESS = 'Invalid address',
}

export class AuthError extends BaseError {
  constructor(message: AuthErrorMessage) {
    super(message);
  }
}

export class InvalidOperatorSignupDataError extends BaseError {
  constructor(readonly detail: string) {
    super('Invalid operator signup data');
  }
}

export class InvalidOperatorRoleError extends InvalidOperatorSignupDataError {
  constructor(role: string) {
    super(`Invalid role: ${role}`);
  }
}

export class InvalidOperatorFeeError extends InvalidOperatorSignupDataError {
  constructor(fee: string) {
    super(`Invalid fee: ${fee}`);
  }
}

export class InvalidOperatorUrlError extends InvalidOperatorSignupDataError {
  constructor(url: string) {
    super(`Invalid url: ${url}`);
  }
}

export class DuplicatedUserEmailError extends BaseError {
  constructor(readonly email: string) {
    super(
      'The email you are trying to use already exists. Please check that the email is correct or use a different email.',
    );
  }
}

export class DuplicatedUserAddressError extends BaseError {
  constructor(readonly address: string) {
    super(
      'The address you are trying to use already exists. Please, use a different address.',
    );
  }
}

export class InactiveUserError extends BaseError {
  constructor(readonly userId: number) {
    super('User is in inactive status. Login forbidden.');
  }
}
