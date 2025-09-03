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
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception instanceof AxiosError) {
      /**
       * All requests we made to external services are supposed to be made by axios,
       * and we either proxy response code or act as a "bad gateway" if sending fails.
       */
      status = exception.response?.status || HttpStatus.BAD_GATEWAY;
      if (status >= 200 && status < 400) {
        /**
         * In case some 3rd party that we are using (e.g. graphql client)
         * throws with such status code (their API schema can be literally anything)
         */
        this.logger.warn('Unexpected http status in exception response', {
          status,
          error: errorUtils.formatError(exception),
          path: request.url,
        });
      }
      message = exception.response?.data?.message || 'Bad gateway';
    } else {
      this.logger.error('Unhandled exception', {
        error: errorUtils.formatError(exception),
        path: request.url,
      });
    }

    if (typeof status !== 'number' || status < 100 || status >= 600) {
      this.logger.error('Invalid status code in exception filter', {
        path: request.url,
        status,
      });
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal Server Error';
    }

    response.removeHeader('Cache-Control');

    response.status(status).json(message);
  }
}
