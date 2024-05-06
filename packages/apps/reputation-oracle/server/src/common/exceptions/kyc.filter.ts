import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { KycError } from '../../modules/kyc/kyc.error';
import { ErrorKyc } from '../constants/errors';

@Catch(KycError)
export class KycExceptionFilter implements ExceptionFilter {
  private logger = new Logger(KycExceptionFilter.name);

  catch(exception: KycError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.BAD_REQUEST;

    if (exception.message === ErrorKyc.InvalidSynapsAPIResponse) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }
    const message = exception.message;
    this.logger.error(`KYC error: ${message}`, exception.stack);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: message,
      path: request.url,
    });
  }
}
