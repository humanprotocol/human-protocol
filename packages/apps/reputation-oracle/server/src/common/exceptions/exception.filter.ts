import {
  ArgumentsHost,
  Catch,
  ExceptionFilter as IExceptionFilter,
  HttpStatus,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DatabaseError } from '../errors/database';

@Catch()
export class ExceptionFilter implements IExceptionFilter {
  private logger = new Logger(ExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    const responseBody: { message: string; [x: string]: unknown } = {
      message: 'Internal server error',
    };

    if (exception instanceof DatabaseError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      responseBody.message = exception.message;

      this.logger.error(
        `Database error: ${exception.message}`,
        exception.stack,
      );
      // Temp hack for the in progress exception handling refactoring
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        responseBody.message = exceptionResponse;
      } else {
        Object.assign(responseBody, exceptionResponse);
      }
    } else {
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json(
      Object.assign(
        {
          status_code: status,
          path: request.url,
          timestamp: new Date().toISOString(),
        },
        responseBody,
      ),
    );
  }
}
