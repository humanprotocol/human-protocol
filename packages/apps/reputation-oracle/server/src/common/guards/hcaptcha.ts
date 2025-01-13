import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { HCaptchaService } from '../../integrations/hcaptcha/hcaptcha.service';
import { AuthConfigService } from '../config/auth-config.service';

@Injectable()
export class HCaptchaGuard implements CanActivate {
  logger = new Logger(HCaptchaGuard.name);
  constructor(
    private readonly hCaptchaService: HCaptchaService,
    private readonly authConfigSerice: AuthConfigService,
  ) {}
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const { body } = request;
    const hCaptchaToken = body['h_captcha_token'];

    // TODO: Remove 27-46 lines once we figure out how to replace human app user
    if (request.path === '/auth/signin') {
      const email = body['email'];
      // Need to validate email because guards being called before any interceptors or pipes
      // Basically to avoid any SQL injections and calling DB to check if user is correct.
      if (email === this.authConfigSerice.humanAppEmail) {
        return true;
      }
    }

    if (!hCaptchaToken) {
      const message = 'hCaptcha token not provided';
      this.logger.error(message, request.path);
      throw new HttpException(
        {
          message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const captchaVerificationResult = await this.hCaptchaService.verifyToken({
      token: hCaptchaToken,
    });
    if (!captchaVerificationResult.success) {
      throw new HttpException('Invalid hCaptcha token', HttpStatus.BAD_REQUEST);
    }

    return true;
  }
}
