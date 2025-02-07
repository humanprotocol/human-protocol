import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Request } from 'express';
import { createHmac } from 'crypto';
import { KycConfigService } from '../config/kyc-config.service';
import logger from '../../logger';

@Injectable()
export class KycWebhookAuthGuard implements CanActivate {
  private readonly logger = logger.child({ context: KycWebhookAuthGuard.name });

  constructor(private readonly kycConfigService: KycConfigService) {}
  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();

    const { headers, body } = request;
    const apiKey = headers['x-auth-client'];
    const hmacSignature = headers['x-hmac-signature'];

    if (!hmacSignature) {
      const message = 'HMAC Signature not provided';
      this.logger.error(message, { requestPath: request.path });
      throw new HttpException(message, HttpStatus.UNAUTHORIZED);
    }

    const signedPayload = createHmac(
      'sha256',
      this.kycConfigService.apiPrivateKey,
    )
      .update(JSON.stringify(body))
      .digest('hex');

    if (
      signedPayload !== hmacSignature ||
      this.kycConfigService.apiKey !== apiKey
    ) {
      const message = 'HMAC Signature does not match';
      this.logger.error(message, { requestPath: request.path });
      throw new HttpException(message, HttpStatus.UNAUTHORIZED);
    }

    return true;
  }
}
