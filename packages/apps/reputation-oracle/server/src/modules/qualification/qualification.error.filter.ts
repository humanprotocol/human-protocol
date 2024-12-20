import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import {
  QualificationError,
  QualificationErrorMessage,
} from './qualification.error';

@Catch(QualificationError)
export class QualificationErrorFilter implements ExceptionFilter {
  private logger = new Logger(QualificationErrorFilter.name);
  catch(exception: QualificationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.BAD_REQUEST;

    if (exception.message === QualificationErrorMessage.NOT_FOUND) {
      status = HttpStatus.NOT_FOUND;
    } else if (
      exception.message === QualificationErrorMessage.NO_WORKERS_FOUND
    ) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
    }

    this.logger.error(exception.message, exception.stack, exception.reference);

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
