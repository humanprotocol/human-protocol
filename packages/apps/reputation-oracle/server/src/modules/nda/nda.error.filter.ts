import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import logger from '../../logger';
import { NDAError } from './nda.error';

@Catch(NDAError)
export class NDAErrorFilter implements ExceptionFilter {
  private readonly logger = logger.child({ context: NDAErrorFilter.name });

  catch(exception: NDAError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = HttpStatus.BAD_REQUEST;

    this.logger.error('NDA error', exception);

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
