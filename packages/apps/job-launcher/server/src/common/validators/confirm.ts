import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

interface IConfirmConstraints {
  required: boolean;
  relatedPropertyName: string;
}

@ValidatorConstraint()
class ValidateConfirm implements ValidatorConstraintInterface {
  private reason: string;

  public validate(value: unknown, args: ValidationArguments): boolean {
    this.reason = ValidateConfirm.isValid(value, args);
    return !this.reason;
  }

  public defaultMessage(): string {
    return this.reason;
  }

  private static isValid(value: unknown, args: ValidationArguments): string {
    const { relatedPropertyName = 'password' }: IConfirmConstraints =
      args.constraints[0];

    const relatedValue = (args.object as any)[relatedPropertyName];

    if (typeof value === 'undefined' || value === '') {
      if (relatedValue) {
        return 'valueMissing';
      } else {
        return '';
      }
    }

    if (typeof value !== 'string') {
      return 'typeMismatch';
    }

    if (relatedValue !== value) {
      return 'badInput';
    }

    return '';
  }
}

export function IsConfirm(
  constraints: Partial<IConfirmConstraints> = {},
  validationOptions?: ValidationOptions,
) {
  return (object: Record<string, any>, propertyName: string): void => {
    registerDecorator({
      name: 'isConfirm',
      target: object.constructor,
      propertyName,
      constraints: [constraints],
      options: validationOptions,
      validator: ValidateConfirm,
    });
  };
}
