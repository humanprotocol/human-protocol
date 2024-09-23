import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception.response && exception.response.data?.statusCode) {
      status = exception.response.data.statusCode;
      message = exception.response.data.message;
    } else {
      this.logger.error(
        `Exception without status code: ${JSON.stringify(exception)}`,
        exception.stack,
      );
    }

    if (typeof status !== 'number' || status < 100 || status >= 600) {
      this.logger.error(`Invalid status code: ${status}, defaulting to 500.`);
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal Server Error';
    }

    this.logger.error(
      `HTTP Status: ${status} | Error Message: ${JSON.stringify(message)} | Request URL: ${request?.url}`,
      exception.stack,
    );

    response.status(status).json(message);
  }
}
