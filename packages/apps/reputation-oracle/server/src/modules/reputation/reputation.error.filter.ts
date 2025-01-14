import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { ReputationError, ReputationErrorMessage } from './reputation.error';

@Catch(ReputationError)
export class ReputationErrorFilter implements ExceptionFilter {
  private logger = new Logger(ReputationErrorFilter.name);
  catch(exception: ReputationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.BAD_REQUEST;

    if (exception.message === ReputationErrorMessage.NOT_FOUND) {
      status = HttpStatus.NOT_FOUND;
    }

    this.logger.error(
      exception.message,
      exception.stack,
      `${exception.chainId} - ${exception.address}`,
    );

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
