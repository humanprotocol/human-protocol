import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import logger from '../../logger';
import { AbuseError } from './abuse.error';

@Catch(AbuseError)
export class AbuseErrorFilter implements ExceptionFilter {
  private readonly logger = logger.child({ context: AbuseErrorFilter.name });

  catch(exception: AbuseError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = HttpStatus.BAD_REQUEST;

    this.logger.error('Abuse error', exception);

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
