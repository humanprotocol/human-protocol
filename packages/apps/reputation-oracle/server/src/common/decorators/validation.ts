/* eslint-disable prettier/prettier */
import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  IsEmail,
} from 'class-validator';
import 'reflect-metadata';

export function IsEnumCaseInsensitive(
  enumType: any,
  validationOptions?: ValidationOptions,
) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    // Attach enum metadata to the property
    Reflect.defineMetadata('custom:enum', enumType, object, propertyName);

    // Register the validation logic using class-validator
    registerDecorator({
      name: 'isEnumWithMetadata',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Retrieve enum type from metadata
          const enumType = Reflect.getMetadata(
            'custom:enum',
            args.object,
            args.property,
          );
          if (!enumType) {
            return false; // If no enum metadata is found, validation fails
          }

          // Validate value is part of the enum
          const enumValues = Object.values(enumType);
          return enumValues.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          // Default message if validation fails
          const enumType = Reflect.getMetadata(
            'custom:enum',
            args.object,
            args.property,
          );
          const enumValues = Object.values(enumType).join(', ');
          return `${args.property} must be a valid enum value. Valid values: [${enumValues}]`;
        },
      },
    });
  };
}

export function LowercasedEmail() {
  return applyDecorators(
    IsEmail(),
    Transform(({ value }: { value: string }) => value.toLowerCase()),
  );
}

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
