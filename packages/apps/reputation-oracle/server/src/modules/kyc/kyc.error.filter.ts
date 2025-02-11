import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { KycError } from './kyc.error';
import logger from '../../logger';

@Catch(KycError)
export class KycErrorFilter implements ExceptionFilter {
  private readonly logger = logger.child({ context: KycErrorFilter.name });

  catch(exception: KycError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = HttpStatus.BAD_REQUEST;

    this.logger.error('KYC error', exception);

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
