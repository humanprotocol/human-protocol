import {
  HttpException,
  HttpStatus,
  Injectable,
  ValidationError,
  ValidationPipe,
  type ValidationPipeOptions,
} from '@nestjs/common';

import { camelToSnake } from '@/utils/case-converters';

@Injectable()
export class HttpValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = this.formatErrorsSnakeCase(errors);
        return new HttpException(
          { validationErrors: messages, message: 'Validation error' },
          HttpStatus.BAD_REQUEST,
        );
      },
      transform: true,
      whitelist: true,
      ...options,
    });
  }

  private formatErrorsSnakeCase(errors: ValidationError[]): string[] {
    return errors
      .flatMap((error) => this.mapChildrenToValidationErrors(error))
      .flatMap((error) =>
        Object.values(error.constraints || {}).map((msg) =>
          msg.replace(error.property, camelToSnake(error.property)),
        ),
      );
  }
}
