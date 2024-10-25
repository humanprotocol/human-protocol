import {
  HttpStatus,
  Injectable,
  ValidationError,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { ControlledError } from '../errors/controlled';

@Injectable()
export class HttpValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      exceptionFactory: (errors: ValidationError[]): ControlledError => {
        const errorMessages = errors
          .map(
            (error) =>
              Object.values((error as any).constraints) as unknown as string,
          )
          .flat();
        throw new ControlledError(
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
