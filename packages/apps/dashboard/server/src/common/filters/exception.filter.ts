import {
  ArgumentsHost,
  Catch,
  ExceptionFilter as IExceptionFilter,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  SubgraphBadIndexerError,
  SubgraphRequestError,
} from '@human-protocol/sdk';

import logger from '../../logger';

@Catch()
export class ExceptionFilter implements IExceptionFilter {
  private readonly logger = logger.child({ context: ExceptionFilter.name });

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    const responseBody: { message: string; [x: string]: unknown } = {
      message: 'Internal server error',
    };

    if (exception instanceof SubgraphRequestError) {
      status = HttpStatus.BAD_GATEWAY;
      responseBody.message = exception.message;

      if (exception instanceof SubgraphBadIndexerError) {
        this.logger.warn('Subgraph bad indexers', {
          error: exception,
          path: request.url,
        });
      } else {
        this.logger.error('Subgraph request failed', {
          error: exception,
          path: request.url,
        });
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        responseBody.message = exceptionResponse;
      } else {
        Object.assign(
          responseBody,
          {
            message: exception.message,
          },
          exceptionResponse,
        );
      }
    } else {
      this.logger.error('Unhandled exception', {
        error: exception,
        path: request.url,
      });
    }

    response.removeHeader('Cache-Control');

    response.status(status).json(
      Object.assign(
        {
          statusCode: status,
          path: request.url,
          timestamp: new Date().toISOString(),
        },
        responseBody,
      ),
    );
  }
}
