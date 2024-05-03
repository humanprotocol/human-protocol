import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ReputationError } from '../../modules/reputation/reputation.error';

@Catch(ReputationError)
export class ReputationExceptionFilter implements ExceptionFilter {
  private logger = new Logger(ReputationExceptionFilter.name);

  catch(exception: ReputationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.BAD_REQUEST;

    const message = exception.message;
    this.logger.error(`Reputation error: ${message}`, exception.stack);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: message,
      path: request.url,
    });
  }
}
