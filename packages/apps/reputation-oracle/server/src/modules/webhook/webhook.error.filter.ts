import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { IncomingWebhookError } from './webhook.error';

@Catch(IncomingWebhookError)
export class IncomingWebhookErrorFilter implements ExceptionFilter {
  private logger = new Logger(IncomingWebhookErrorFilter.name);
  catch(exception: IncomingWebhookError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = HttpStatus.BAD_REQUEST;

    this.logger.error(
      exception.message,
      exception.stack,
      `${exception.chainId} - ${exception.address}`,
    );

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
