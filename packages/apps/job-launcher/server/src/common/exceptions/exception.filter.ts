import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { DatabaseError } from '../errors/database';
import { CustomError } from '../errors/custom';

@Catch(CustomError, DatabaseError)
export class ExceptionFilter implements ExceptionFilter {
  private logger = new Logger(ExceptionFilter.name);

  catch(exception: CustomError | DatabaseError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof CustomError) {
      status = exception.status;
      message = exception.message;

      this.logger.error(`Job Launcher error: ${message}`, exception.stack);
    } else if (exception instanceof DatabaseError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      message = `Database error: ${exception.message}`;

      this.logger.error(message, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: message,
      path: request.url,
    });
  }
}
