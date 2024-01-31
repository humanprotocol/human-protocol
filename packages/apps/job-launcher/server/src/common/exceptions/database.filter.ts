import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DatabaseError } from '../../database/database.error';

@Catch(DatabaseError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: DatabaseError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.UNPROCESSABLE_ENTITY;
    const message = exception.message;
    this.logger.error(`Database error: ${message}`, exception.stack);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: message,
      path: request.url,
    });
  }
}
