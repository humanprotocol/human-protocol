import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ControlledError } from '../errors/controlled';
import { createHmac } from 'crypto';
import { KycConfigService } from '../config/kyc-config.service';

@Injectable()
export class KycWebhookAuthGuard implements CanActivate {
  constructor(private readonly kycConfigService: KycConfigService) {}
  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();

    const { headers, body } = request;
    const apiKey = headers['x-auth-client'];
    const hmacSignature = headers['x-hmac-signature'];

    if (!hmacSignature) {
      throw new ControlledError('Unauthorized', HttpStatus.UNAUTHORIZED);
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
      throw new ControlledError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    return true;
  }
}
