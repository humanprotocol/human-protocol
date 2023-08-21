import { ConflictException } from "@nestjs/common";
import { ethers } from "ethers";
import { ErrorSignature } from "../constants/errors";

export function verifySignature(
    message: string,
    signature: string,
    address: string,
  ): boolean {
    const messageBytes = ethers.utils.toUtf8Bytes(message);
    const signer = recoverSigner(messageBytes, signature);

    if (signer.toLowerCase() !== address.toLowerCase()) {
      throw new ConflictException(
        ErrorSignature.SignatureNotVerified);
    }

    return true;
  }

export function recoverSigner(message: object, signature: string): string {  
  try {  
    const messageHash = ethers.utils.hashMessage(JSON.stringify(message));
    const signer = ethers.utils.verifyMessage(messageHash, signature);

    return signer;
  } catch (e) {
    throw new ConflictException(
      ErrorSignature.InvalidSignature);
  }
}

export async function signMessage(message: string, privateKey: string): Promise<string> {
  const wallet = new ethers.Wallet(privateKey);

  const messageBytes = ethers.utils.toUtf8Bytes(message);
  const messageHash = ethers.utils.hashMessage(JSON.stringify(messageBytes));
  const signature = await wallet.signMessage(messageHash);

  return signature
}