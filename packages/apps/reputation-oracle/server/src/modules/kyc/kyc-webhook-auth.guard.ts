import { createHmac } from 'crypto';

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Request } from 'express';

import { KycConfigService } from '@/config';
import * as securityUtils from '@/utils/security';

@Injectable()
export class KycWebhookAuthGuard implements CanActivate {
  constructor(private readonly kycConfigService: KycConfigService) {}
  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();

    const { headers, body } = request;
    const hmacSignature = headers['x-hmac-signature'];

    if (!hmacSignature) {
      throw new HttpException(
        'HMAC Signature not provided',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (typeof hmacSignature !== 'string') {
      throw new HttpException(
        'Invalid HMAC Signature type',
        HttpStatus.BAD_REQUEST,
      );
    }

    const signedPayload = createHmac(
      'sha256',
      this.kycConfigService.apiPrivateKey,
    )
      .update(JSON.stringify(body))
      .digest('hex');

    if (!securityUtils.safeCompare(signedPayload, hmacSignature)) {
      throw new HttpException(
        'HMAC Signature does not match',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return true;
  }
}
