import {
  HttpStatus,
  Injectable,
  ValidationError,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { ControlledHttpError } from '../errors/controlled-http';

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
        throw new ControlledHttpError(
          errorMessages.join(', '),
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
