import {
  HttpException,
  HttpStatus,
  Injectable,
  ValidationError,
  ValidationPipe,
  type ValidationPipeOptions,
} from '@nestjs/common';

import { camelToSnake } from '../../utils/case-converters';

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
    const rawMessages = this.flattenValidationErrors(errors);
    return rawMessages.map((msg) => {
      const firstSpace = msg.indexOf(' ');
      if (firstSpace === -1) return msg;

      const rawPath = msg.slice(0, firstSpace);
      const rest = msg.slice(firstSpace + 1);

      const transformedPath = rawPath
        .split('.')
        .map((segment) => segment.replace(/^[A-Za-z0-9_]+/, camelToSnake))
        .join('.');

      return `${transformedPath} ${rest}`;
    });
  }
}
