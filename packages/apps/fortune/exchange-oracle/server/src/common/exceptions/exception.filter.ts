import {
  ArgumentsHost,
  Catch,
  ExceptionFilter as IExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import logger from '../../logger';
import {
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ServerError,
  DatabaseError,
} from '../errors';

@Catch()
export class ExceptionFilter implements IExceptionFilter {
  private readonly logger = logger.child({ context: ExceptionFilter.name });

  private getStatus(exception: any): number {
    if (exception instanceof ValidationError) {
      return HttpStatus.BAD_REQUEST;
    } else if (exception instanceof AuthError) {
      return HttpStatus.UNAUTHORIZED;
    } else if (exception instanceof ForbiddenError) {
      return HttpStatus.FORBIDDEN;
    } else if (exception instanceof NotFoundError) {
      return HttpStatus.NOT_FOUND;
    } else if (exception instanceof ConflictError) {
      return HttpStatus.CONFLICT;
    } else if (exception instanceof ServerError) {
      return HttpStatus.UNPROCESSABLE_ENTITY;
    } else if (exception instanceof DatabaseError) {
      return HttpStatus.UNPROCESSABLE_ENTITY;
    }

    const exceptionStatusCode = exception.statusCode || exception.status;

    return exceptionStatusCode || HttpStatus.INTERNAL_SERVER_ERROR;
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getStatus(exception);
    const message = exception.message || 'Internal server error';

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error('Unhandled exception', {
        error: exception,
        path: request.url,
      });
    }

    response.removeHeader('Cache-Control');

    response.status(status).json({
      status_code: status,
      timestamp: new Date().toISOString(),
      message: message,
      path: request.url,
    });
  }
}
