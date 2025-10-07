import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Request } from 'express';

import { HCaptchaService } from './hcaptcha.service';

@Injectable()
export class HCaptchaGuard implements CanActivate {
  constructor(private readonly hCaptchaService: HCaptchaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const { body } = request;
    /**
     * Guards called before interceptors,
     * so we need to access body params as is
     */
    const hCaptchaToken: string = body['h_captcha_token'];
    if (!hCaptchaToken) {
      throw new HttpException(
        'h_captcha_token not provided',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isTokenValid = await this.hCaptchaService.verifyToken(hCaptchaToken);
    if (!isTokenValid) {
      throw new HttpException(
        'Invalid h_captcha_token',
        HttpStatus.BAD_REQUEST,
      );
    }

    return true;
  }
}
