import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DatabaseError, DatabaseErrorCodes } from 'src/database/database.error';

@Catch(DatabaseError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: DatabaseError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    switch (exception.code) {
      case DatabaseErrorCodes.EntityDuplication:
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        break;
    }
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
