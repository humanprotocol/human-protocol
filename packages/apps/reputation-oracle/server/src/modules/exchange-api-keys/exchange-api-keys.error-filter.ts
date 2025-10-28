import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import logger from '@/logger';

import {
  ExchangeApiKeyNotFoundError,
  IncompleteKeySuppliedError,
  KeyAuthorizationError,
  ActiveExchangeApiKeyExistsError,
} from './exchange-api-keys.errors';
import { ExchangeApiClientError } from '../exchange/errors';
import { UserNotFoundError } from '../user';

@Catch(
  UserNotFoundError,
  IncompleteKeySuppliedError,
  KeyAuthorizationError,
  ActiveExchangeApiKeyExistsError,
  ExchangeApiKeyNotFoundError,
)
export class ExchangeApiKeysControllerErrorsFilter implements ExceptionFilter {
  private readonly logger = logger.child({
    context: ExchangeApiKeysControllerErrorsFilter.name,
  });

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof UserNotFoundError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
    } else if (
      exception instanceof IncompleteKeySuppliedError ||
      exception instanceof KeyAuthorizationError ||
      exception instanceof ActiveExchangeApiKeyExistsError
    ) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
    } else if (exception instanceof ExchangeApiClientError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
    } else if (exception instanceof ExchangeApiKeyNotFoundError) {
      status = HttpStatus.NOT_FOUND;
    }

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
