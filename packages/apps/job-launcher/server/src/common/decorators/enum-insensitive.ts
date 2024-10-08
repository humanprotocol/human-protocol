import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsEnumInsensitive(
  entity: object,
  validationOptions?: ValidationOptions,
) {
  const originalEnumValues = Object.values(entity);
  const upperCaseEnumValues = originalEnumValues.map((val) =>
    val.toUpperCase(),
  );

  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEnumInsensitive',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          return upperCaseEnumValues.some(
            (enumVal) => enumVal === value.toUpperCase(),
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be one of the following values: ${originalEnumValues.join(', ')}`;
        },
      },
    });
  };
}
