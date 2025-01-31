import {
  HttpException,
  HttpStatus,
  Injectable,
  ValidationError,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';

// TODO: Revisit validation options
@Injectable()
export class HttpValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      exceptionFactory: (errors: ValidationError[]) => {
        const errorMessages = errors
          .map(
            (error) =>
              Object.values((error as any).constraints) as unknown as string,
          )
          .flat();

        return new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            timestamp: new Date().toISOString(),
            message: errorMessages.join(', '),
          },
          HttpStatus.BAD_REQUEST,
        );
      },
      transform: true,
      whitelist: true,
      forbidUnknownValues: true,
      ...options,
    });
  }
}
