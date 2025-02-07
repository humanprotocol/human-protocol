import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import {
  AuthError,
  DuplicatedUserAddressError,
  DuplicatedUserEmailError,
  InvalidOperatorSignupDataError,
} from './auth.error';

import logger from '../../logger';

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
  private readonly logger = logger.child({
    context: AuthControllerErrorsFilter.name,
  });

  catch(exception: AuthControllerError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.UNAUTHORIZED;

    if (
      exception instanceof DuplicatedUserEmailError ||
      exception instanceof DuplicatedUserAddressError
    ) {
      status = HttpStatus.CONFLICT;
    } else if (exception instanceof InvalidOperatorSignupDataError) {
      status = HttpStatus.BAD_REQUEST;
    }

    this.logger.error('Auth error', exception);

    return response.status(status).json({
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
