import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CredentialError } from '../../modules/credentials/credential.error';

@Catch(CredentialError)
export class CredentialExceptionFilter implements ExceptionFilter {
  private logger = new Logger(CredentialExceptionFilter.name);

  catch(exception: CredentialError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.BAD_REQUEST;
    const message = exception.message;
    this.logger.error(`Credential error: ${message}`, exception.stack);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: message,
      path: request.url,
    });
  }
}
