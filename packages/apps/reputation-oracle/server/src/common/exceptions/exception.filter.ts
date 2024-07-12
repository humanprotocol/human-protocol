import {
  ArgumentsHost,
  Catch,
  ExceptionFilter as IExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DatabaseError } from '../errors/database';
import { ControlledError } from '../errors/controlled';

@Catch()
export class ExceptionFilter implements IExceptionFilter {
  private logger = new Logger(ExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof ControlledError) {
      status = exception.status;
      message = exception.message;

      this.logger.error(`Reputation Oracle error: ${message}`, exception.stack);
    } else if (exception instanceof DatabaseError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      message = exception.message;

      this.logger.error(
        `Database error: ${exception.message}`,
        exception.stack,
      );
    } else {
      if (exception.statusCode === HttpStatus.BAD_REQUEST) {
        status = exception.statusCode;
        message = exception.message;
      }
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: message,
      path: request.url,
    });
  }
}
