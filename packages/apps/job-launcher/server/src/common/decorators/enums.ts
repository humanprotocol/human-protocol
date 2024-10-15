import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
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
