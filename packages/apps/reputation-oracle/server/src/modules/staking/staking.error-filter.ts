import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import logger from '@/logger';
import { UserNotFoundError } from '@/modules/user';

@Catch(UserNotFoundError)
export class StakingControllerErrorsFilter implements ExceptionFilter {
  private readonly logger = logger.child({
    context: StakingControllerErrorsFilter.name,
  });

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof UserNotFoundError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
    }

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
