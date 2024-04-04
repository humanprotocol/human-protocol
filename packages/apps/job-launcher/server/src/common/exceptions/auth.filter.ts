import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthError } from '../../modules/auth/auth.error';
import { ErrorUser } from '../constants/errors';

@Catch(AuthError)
export class AuthExceptionFilter implements ExceptionFilter {
  private logger = new Logger(AuthExceptionFilter.name);

  catch(exception: AuthError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.FORBIDDEN;

    if (exception.message === ErrorUser.NotFound) {
      status = HttpStatus.NO_CONTENT;
    }
    const message = exception.message;
    this.logger.error(`Auth error: ${message}`, exception.stack);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: message,
      path: request.url,
    });
  }
}
