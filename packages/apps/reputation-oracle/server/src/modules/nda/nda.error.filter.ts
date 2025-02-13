import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { NdaError, NdaNotFoundError, NdaSignedError } from './nda.error';
import logger from '../../logger';

type NdaControllerError = NdaError | NdaNotFoundError | NdaSignedError;

@Catch(NdaError, NdaNotFoundError, NdaSignedError)
export class NdaErrorFilter implements ExceptionFilter {
  private readonly logger = logger.child({ context: NdaErrorFilter.name });

  catch(exception: NdaControllerError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = HttpStatus.BAD_REQUEST;

    this.logger.error('NDA error', exception);

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
