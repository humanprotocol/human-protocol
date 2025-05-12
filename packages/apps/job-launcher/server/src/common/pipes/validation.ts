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
        const errorMessages = errors
          .map(
            (error) =>
              Object.values((error as any).constraints) as unknown as string,
          )
          .flat();
        throw new ValidationError(errorMessages.join(', '));
      },
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      ...options,
    });
  }
}
