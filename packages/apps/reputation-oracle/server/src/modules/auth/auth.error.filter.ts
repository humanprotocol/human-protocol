import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import {
  AuthError,
  DuplicatedUserAddressError,
  DuplicatedUserEmailError,
  InvalidOperatorSignupDataError,
} from './auth.error';

type AuthControllerError =
  | AuthError
  | DuplicatedUserEmailError
  | InvalidOperatorSignupDataError
  | DuplicatedUserAddressError;

@Catch(
  AuthError,
  DuplicatedUserEmailError,
  DuplicatedUserAddressError,
  InvalidOperatorSignupDataError,
)
export class AuthControllerErrorsFilter implements ExceptionFilter {
  private logger = new Logger(AuthControllerErrorsFilter.name);
  catch(exception: AuthControllerError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.UNAUTHORIZED;

    let logContext: string | undefined;
    if (exception instanceof DuplicatedUserEmailError) {
      status = HttpStatus.CONFLICT;
      logContext = exception.email;
    } else if (exception instanceof DuplicatedUserAddressError) {
      status = HttpStatus.CONFLICT;
      logContext = exception.address;
    } else if (exception instanceof InvalidOperatorSignupDataError) {
      status = HttpStatus.BAD_REQUEST;
      logContext = exception.detail;
    }

    this.logger.error(exception.message, exception.stack, logContext);

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
