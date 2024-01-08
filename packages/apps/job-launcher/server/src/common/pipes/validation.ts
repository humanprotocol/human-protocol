import {
  BadRequestException,
  Injectable,
  PipeTransform,
  ValidationError,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { ValidatePasswordDto } from '../../modules/auth/auth.dto';
import { ErrorAuth } from '../constants/errors';

@Injectable()
export class HttpValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      exceptionFactory: (errors: ValidationError[]): BadRequestException =>
        new BadRequestException(errors),
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      ...options,
    });
  }
}

@Injectable()
export class PasswordValidationPipe implements PipeTransform {
  transform(value: ValidatePasswordDto) {
    if (!this.isValidPassword(value.password)) {
      throw new BadRequestException(ErrorAuth.PasswordIsNotStrongEnough);
    }

    return value;
  }

  private isValidPassword(password: string): boolean {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\|'"/`[\]:;<>,.?~\\-]).*$/;
    return regex.test(password);
  }
}
