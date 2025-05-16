import {
  ArgumentsHost,
  Catch,
  ExceptionFilter as IExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ServerError,
} from '../errors';

@Catch()
export class ExceptionFilter implements IExceptionFilter {
  private logger = new Logger(ExceptionFilter.name);
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
    } else if (exception.statusCode) {
      return exception.statusCode;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getStatus(exception);
    const message = exception.message || 'Internal server error';

    this.logger.error(
      `Exception caught: ${message}`,
      exception.stack || 'No stack trace available',
    );

    response.status(status).json({
      status_code: status,
      timestamp: new Date().toISOString(),
      message: message,
      path: request.url,
    });
  }
}
