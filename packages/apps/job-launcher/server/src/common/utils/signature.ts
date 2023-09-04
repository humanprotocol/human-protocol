import { ConflictException } from '@nestjs/common';
import { ethers } from 'ethers';
import { ErrorSignature } from '../constants/errors';

export function verifySignature(
  message: object | string,
  signature: string,
  address: string,
): boolean {
  const signer = recoverSigner(message, signature);

  if (signer.toLowerCase() !== address.toLowerCase()) {
    throw new ConflictException(ErrorSignature.SignatureNotVerified);
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
    return ethers.utils.verifyMessage(message, signature);
  } catch (e) {
    throw new ConflictException(ErrorSignature.InvalidSignature);
  }
}
