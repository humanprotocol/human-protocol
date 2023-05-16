/* eslint-disable @typescript-eslint/no-explicit-any */
import { Signer } from 'ethers';
import { ErrorSigner } from './error';

export function requiresSigner(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (this: any, ...args: any[]) {
    if (!Signer.isSigner(this.signerOrProvider)) {
      throw ErrorSigner;
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}
