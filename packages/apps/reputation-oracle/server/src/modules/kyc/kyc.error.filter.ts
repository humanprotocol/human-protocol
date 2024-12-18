import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { KycError, KycErrorMessage } from './kyc.error';

@Catch(KycError)
export class KycErrorFilter implements ExceptionFilter {
  private logger = new Logger(KycErrorFilter.name);
  catch(exception: KycError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = HttpStatus.BAD_REQUEST;

    this.logger.error(exception.message, exception.stack, exception.userId);

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
