import {
  HttpException,
  HttpStatus,
  Injectable,
  ValidationError,
  ValidationPipe,
  type ValidationPipeOptions,
} from '@nestjs/common';

@Injectable()
export class HttpValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      exceptionFactory: (errors: ValidationError[]) => {
        const flattenErrors = this.flattenValidationErrors(errors);

        return new HttpException(
          { validationErrors: flattenErrors, message: 'Validation error' },
          HttpStatus.BAD_REQUEST,
        );
      },
      transform: true,
      whitelist: true,
      ...options,
    });
  }
}
