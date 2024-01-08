import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import zxcvbn from 'zxcvbn';

interface IPasswordConstraints {
  required: boolean;
  score: number;
}

@ValidatorConstraint()
class ValidatePassword implements ValidatorConstraintInterface {
  private reason: string;

  public validate(value: unknown, args: ValidationArguments): boolean {
    this.reason = ValidatePassword.isValid(value, args);
    return !this.reason;
  }

  public defaultMessage(): string {
    return this.reason;
  }

  private static isValid(value: unknown, args: ValidationArguments): string {
    const { required = true, score = 0 }: IPasswordConstraints =
      args.constraints[0];

    if (typeof value === 'undefined' || value === '') {
      if (required) {
        return 'valueMissing';
      } else {
        return '';
      }
    }

    if (typeof value !== 'string') {
      return 'typeMismatch';
    }

    if (zxcvbn(value).score < score) {
      return 'weak';
    }

    return '';
  }
}

export function IsPassword(
  constraints: Partial<IPasswordConstraints> = {},
  validationOptions?: ValidationOptions,
) {
  return (object: Record<string, any>, propertyName: string): void => {
    registerDecorator({
      name: 'isPassword',
      target: object.constructor,
      propertyName,
      constraints: [constraints],
      options: validationOptions,
      validator: ValidatePassword,
    });
  };
}
