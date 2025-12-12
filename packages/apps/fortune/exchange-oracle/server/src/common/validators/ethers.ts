import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ethers } from 'ethers';

@ValidatorConstraint({ name: 'IsValidEthereumAddress' })
@Injectable()
class ValidateEthereumAddress implements ValidatorConstraintInterface {
  public validate(value: string): boolean {
    return ethers.isAddress(value);
  }

  public defaultMessage(): string {
    return 'Invalid Ethereum address';
  }
}

export function IsValidEthereumAddress(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string): void => {
    registerDecorator({
      name: 'IsValidEthereumAddress',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: ValidateEthereumAddress,
    });
  };
}
