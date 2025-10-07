import {
  Injectable,
  ValidationPipe,
  ValidationPipeOptions,
  ValidationError as ValidError,
} from '@nestjs/common';
import { ValidationError } from '../errors';
import { camelToSnake } from '../utils/case-converter';

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
    return errors
      .flatMap((error) => this.mapChildrenToValidationErrors(error))
      .flatMap((error) =>
        Object.values(error.constraints || {}).map((msg) =>
          msg.replace(error.property, camelToSnake(error.property)),
        ),
      );
  }
}
