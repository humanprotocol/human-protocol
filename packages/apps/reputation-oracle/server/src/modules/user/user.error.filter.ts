import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import {
  UserError,
  DuplicatedWalletAddressError,
  InvalidWeb3SignatureError,
} from './user.error';

type UserControllerError =
  | UserError
  | DuplicatedWalletAddressError
  | InvalidWeb3SignatureError;

@Catch(UserError, DuplicatedWalletAddressError, InvalidWeb3SignatureError)
export class UserErrorFilter implements ExceptionFilter {
  private logger = new Logger(UserErrorFilter.name);
  catch(exception: UserControllerError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.BAD_REQUEST;

    if (exception instanceof DuplicatedWalletAddressError) {
      status = HttpStatus.CONFLICT;
    } else if (exception instanceof InvalidWeb3SignatureError) {
      status = HttpStatus.CONFLICT;
    }

    this.logger.error(exception.message, exception.stack, exception.userId);

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
