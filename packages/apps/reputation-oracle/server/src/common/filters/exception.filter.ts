import {
  ArgumentsHost,
  Catch,
  ExceptionFilter as IExceptionFilter,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DatabaseError, isDuplicatedError } from '../../database';
import logger from '../../logger';
import { transformKeysFromCamelToSnake } from '../../utils/case-converters';

@Catch()
export class ExceptionFilter implements IExceptionFilter {
  private readonly logger = logger.child({ context: ExceptionFilter.name });

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    const responseBody: { message: string; [x: string]: unknown } = {
      message: 'Internal server error',
    };

    if (exception instanceof DatabaseError) {
      if (isDuplicatedError(exception)) {
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        responseBody.message = 'Unprocessable entity';
      }
      this.logger.error('Database error', exception);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        responseBody.message = exceptionResponse;
      } else if (
        'error' in exceptionResponse &&
        exceptionResponse.error === exception.message
      ) {
        /**
         * This is the case for "sugar" exception classes
         * (e.g. UnauthorizedException) that have custom message
         */
        responseBody.message = exceptionResponse.error;
      } else {
        /**
         * Exception filters called after interceptors,
         * so it's just a safety belt
         */
        Object.assign(
          responseBody,
          transformKeysFromCamelToSnake(exceptionResponse),
        );
      }
    } else {
      this.logger.error('Unhandled exception', exception);
    }

    response.removeHeader('Cache-Control');

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
