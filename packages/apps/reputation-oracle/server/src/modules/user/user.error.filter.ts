import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import {
  UserError,
  DuplicatedWalletAddressError,
  InvalidWeb3SignatureError,
} from './user.error';
import logger from '../../logger';

type UserControllerError =
  | UserError
  | DuplicatedWalletAddressError
  | InvalidWeb3SignatureError;

@Catch(UserError, DuplicatedWalletAddressError, InvalidWeb3SignatureError)
export class UserErrorFilter implements ExceptionFilter {
  private readonly logger = logger.child({ context: UserErrorFilter.name });

  catch(exception: UserControllerError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.BAD_REQUEST;

    if (exception instanceof DuplicatedWalletAddressError) {
      status = HttpStatus.CONFLICT;
    }

    this.logger.error('User error', exception);

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
