import {
  Injectable,
  ValidationError as ValidError,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { ValidationError } from '../errors';

@Injectable()
export class HttpValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      exceptionFactory: (errors: ValidError[]): ValidationError => {
        const flattenErrors = this.flattenValidationErrors(errors);
        throw new ValidationError(flattenErrors.join(', '));
      },
      transform: true,
      whitelist: true,
      ...options,
    });
  }
}
