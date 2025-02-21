import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import {
  QualificationError,
  QualificationErrorMessage,
} from './qualification.error';
import logger from '../../logger';

@Catch(QualificationError)
export class QualificationErrorFilter implements ExceptionFilter {
  private readonly logger = logger.child({
    context: QualificationErrorFilter.name,
  });

  catch(exception: QualificationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.BAD_REQUEST;

    if (exception.message === QualificationErrorMessage.NOT_FOUND) {
      status = HttpStatus.NOT_FOUND;
    } else if (
      [
        QualificationErrorMessage.NO_WORKERS_FOUND,
        QualificationErrorMessage.CANNOT_DETELE_ASSIGNED_QUALIFICATION,
      ].includes(exception.message as QualificationErrorMessage)
    ) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
    }

    this.logger.error('Qualification error', exception);

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
