import { ConflictException } from '@nestjs/common';
import { ethers } from 'ethers';

export function verifySignature(
  message: object | string,
  signature: string,
  addresses: string[],
): boolean {
  const signer = recoverSigner(message, signature);

  if (
    !addresses.some((address) => address.toLowerCase() === signer.toLowerCase())
  ) {
    throw new ConflictException('Signature not verified');
  }

  return true;
}

export async function signMessage(
  message: object | string,
  privateKey: string,
): Promise<string> {
  if (typeof message !== 'string') {
    message = JSON.stringify(message);
  }

  const wallet = new ethers.Wallet(privateKey);
  const signature = await wallet.signMessage(message);

  return signature;
}

export function recoverSigner(
  message: object | string,
  signature: string,
): string {
  if (typeof message !== 'string') {
    message = JSON.stringify(message);
  }

  try {
    return ethers.verifyMessage(message, signature);
  } catch (e) {
    throw new ConflictException('Invalid signature');
  }
}
