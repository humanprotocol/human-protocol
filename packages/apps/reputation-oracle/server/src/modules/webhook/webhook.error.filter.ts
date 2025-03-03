import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { IncomingWebhookError } from './webhook.error';
import logger from '../../logger';

@Catch(IncomingWebhookError)
export class IncomingWebhookErrorFilter implements ExceptionFilter {
  private readonly logger = logger.child({
    context: IncomingWebhookErrorFilter.name,
  });

  catch(exception: IncomingWebhookError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = HttpStatus.BAD_REQUEST;

    this.logger.error('Incoming webhook error', exception);

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
