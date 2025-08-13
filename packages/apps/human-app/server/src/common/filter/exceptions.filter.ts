import {
  ArgumentsHost,
  Catch,
  ExceptionFilter as IExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import logger from '../../logger';
import { AxiosError } from 'axios';
import * as errorUtils from '../utils/error';

@Catch()
export class ExceptionFilter implements IExceptionFilter {
  private readonly logger = logger.child({ context: ExceptionFilter.name });

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception.response) {
      status = exception.response.status;
      message =
        exception.response.data?.message || exception.response.statusText;
    } else {
      let formattedError = exception;
      if (exception instanceof AxiosError) {
        formattedError = errorUtils.formatError(exception);
      }
      this.logger.error('Unhandled exception', formattedError);
    }

    if (typeof status !== 'number' || status < 100 || status >= 600) {
      this.logger.error('Invalid status code in exception filter', {
        status,
      });
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal Server Error';
    }

    response.removeHeader('Cache-Control');

    response.status(status).json(message);
  }
}
