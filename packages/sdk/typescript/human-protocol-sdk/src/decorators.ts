/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorSigner } from './error';

export function requiresSigner(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (this: any, ...args: any[]) {
    try {
      this.runner.getAddress();
    } catch {
      throw ErrorSigner;
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}
