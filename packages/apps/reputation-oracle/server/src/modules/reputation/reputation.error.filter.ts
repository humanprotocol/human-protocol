import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { ReputationError, ReputationErrorMessage } from './reputation.error';
import logger from '../../logger';

@Catch(ReputationError)
export class ReputationErrorFilter implements ExceptionFilter {
  private readonly logger = logger.child({
    context: ReputationErrorFilter.name,
  });

  catch(exception: ReputationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.BAD_REQUEST;

    if (exception.message === ReputationErrorMessage.NOT_FOUND) {
      status = HttpStatus.NOT_FOUND;
    }

    this.logger.error('Reputation error', exception);

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
