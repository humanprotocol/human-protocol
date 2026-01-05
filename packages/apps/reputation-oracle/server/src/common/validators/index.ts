import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsString,
  Length,
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

function unknownToLowerCase(v: unknown): string {
  return `${v}`.toLowerCase();
}

export function IsLowercasedEnum(
  entity: object,
  validationOptions?: ValidationOptions,
) {
  return applyDecorators(
    IsEnum(entity, validationOptions),
    Transform(({ value }: { value: unknown[] | unknown }) => {
      if (validationOptions?.each && Array.isArray(value)) {
        return value.map(unknownToLowerCase);
      }
      return unknownToLowerCase(value);
    }),
  );
}

export function IsValidPassword() {
  return applyDecorators(IsString(), Length(8, 128));
}
