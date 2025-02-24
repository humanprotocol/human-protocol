import { ChainId } from '@human-protocol/sdk';
import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  IsEnum,
} from 'class-validator';

export function IsValidWeb3Signature(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidWeb3Signature',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') {
            return false;
          }

          const regex = /^0x[a-fA-F0-9]{130}$/;
          return regex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Ethereum Web3 signature in hex format starting with "0x"`;
        },
      },
    });
  };
}

/**
 * TODO: Remove "ALL" value from ChainId enum in sdk
 * to avoid selecting it as valid value in flows
 */
export function IsChainId() {
  return applyDecorators(
    IsEnum(ChainId),
    Transform(({ value }) => Number(value)),
  );
}
