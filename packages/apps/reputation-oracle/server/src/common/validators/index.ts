import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
  ValidationOptions,
} from 'class-validator';

export * from './password';
export * from './web3';

/**
 * TODO: if we want to use lowercased emails in the system,
 * then it should be done somewhere in the business logic,
 * not in HTTP validation layer
 */
export function IsLowercasedEmail() {
  return applyDecorators(
    IsEmail(),
    Transform(({ value }: { value: string }) => value.toLowerCase()),
  );
}

export function IsLowercasedEnum(
  entity: object,
  validationOptions?: ValidationOptions,
) {
  return applyDecorators(
    IsEnum(entity, validationOptions),
    Transform(({ value }) => {
      if (validationOptions?.each) {
        return value.map((v: string) => v.toLowerCase());
      }
      return value.toLowerCase();
    }),
  );
}

export function IsValidPassword() {
  return applyDecorators(
    IsString(),
    MinLength(8, {
      message: 'Password must be at least 8 characters long.',
    }),
    MaxLength(128, {
      message: 'Password must be at most 128 characters',
    }),
  );
}
