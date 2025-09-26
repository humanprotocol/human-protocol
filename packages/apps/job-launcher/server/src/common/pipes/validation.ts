import {
  Injectable,
  ValidationError as ValidError,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { ValidationError } from '../errors';
import { CaseConverter } from '../utils/case-converter';

@Injectable()
export class HttpValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      exceptionFactory: (errors: ValidError[]): ValidationError => {
        const messages = this.formatErrorsSnakeCase(errors);
        throw new ValidationError('Validation error', undefined, messages);
      },
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      ...options,
    });
  }

  private formatErrorsSnakeCase(errors: ValidError[]): string[] {
    const rawMessages = this.flattenValidationErrors(errors);
    return rawMessages.map((msg) => {
      const firstSpace = msg.indexOf(' ');
      if (firstSpace === -1) return msg;

      const rawPath = msg.slice(0, firstSpace);
      const rest = msg.slice(firstSpace + 1);

      const transformedPath = rawPath
        .split('.')
        .map((segment) =>
          segment.replace(/^[A-Za-z0-9_]+/, CaseConverter.transformToSnakeCase),
        )
        .join('.');

      return `${transformedPath} ${rest}`;
    });
  }
}
