import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, ValidationOptions } from 'class-validator';

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
