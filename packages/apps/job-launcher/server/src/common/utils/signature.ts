import { ConflictException } from "@nestjs/common";
import { ethers } from "ethers";
import { ErrorSignature } from "../constants/errors";

export function verifySignature(
  message: string,
  signature: string,
  address: string,
): boolean {
  const signer = recoverSigner(message, signature);

  if (signer.toLowerCase() !== address.toLowerCase()) {
    throw new ConflictException(
      ErrorSignature.SignatureNotVerified);
  }

  return true;
}

export async function signMessage(message: string, privateKey: string): Promise<string> {
  const wallet = new ethers.Wallet(privateKey);
  const signature = await wallet.signMessage(message);

  return signature;
}

export function recoverSigner(message: string, signature: string): string {  
  try {  
    return ethers.utils.verifyMessage(message, signature);
  } catch (e) {
    throw new ConflictException(
      ErrorSignature.InvalidSignature);
  }
}