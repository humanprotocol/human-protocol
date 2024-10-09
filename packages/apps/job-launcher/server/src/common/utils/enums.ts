import 'reflect-metadata';

export function EnumMetadata(enumType: any) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata('custom:enum', enumType, target, propertyKey);
  };
}
