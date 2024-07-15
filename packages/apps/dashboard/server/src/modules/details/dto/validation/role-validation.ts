import {
  registerDecorator,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Role } from '@human-protocol/sdk';

@ValidatorConstraint({ async: false })
export class IsValidRoleConstraint implements ValidatorConstraintInterface {
  validate(role: string) {
    return Object.values(Role).includes(role);
  }

  defaultMessage() {
    return `Role must be one of the following values: ${Object.values(
      Role,
    ).join(', ')}`;
  }
}

export function IsRoleValid() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      validator: IsValidRoleConstraint,
    });
  };
}
