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
    /**
     * Guards called before interceptors,
     * so we need to access body params as is
     */
    const hCaptchaToken = body['h_captcha_token'];
    // TODO: Remove 27-45 lines once we figure out how to replace human app user
    if (request.path === '/auth/web2/signin') {
      const email = body['email'];
      // Checking email here to avoid unnecessary db calls
      if (email === this.authConfigSerice.humanAppEmail) {
        return true;
      }
    }

    if (!hCaptchaToken) {
      const message = 'hCaptcha token not provided';
      this.logger.error(message, request.path);
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
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
