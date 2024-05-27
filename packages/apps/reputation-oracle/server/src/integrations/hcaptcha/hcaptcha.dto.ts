import { TokenType } from '../../common/enums/hcaptcha';

export class hCaptchaApiParams {
  public ip?: string;
}

export class hCaptchaVerifyToken extends hCaptchaApiParams {
  public type: TokenType;
  public token: string;
}

export class hCaptchaRegisterLabeler extends hCaptchaApiParams {
  public email: string;
  public language: string;
  public country: string;
  public address: string;
}

export class hCaptchaGetLabeler extends hCaptchaApiParams {
  public email: string;
}
