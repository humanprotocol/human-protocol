import { WebhookDto } from '@/modules/webhook/webhook.dto';
import { ConflictException } from '@nestjs/common';
import { ethers } from 'ethers';

export function verifySignature(
  message: WebhookDto | string,
  signature: string,
  addresses: string[],
): boolean {
  const messageString = formatMessage(message);
  const signer = recoverSigner(messageString, signature);

  if (
    !addresses.some((address) => address.toLowerCase() === signer.toLowerCase())
  ) {
    throw new ConflictException('Signature not verified');
  }

  return true;
}

function formatMessage(message: WebhookDto | string): string {
  if (typeof message === 'string') {
    return message;
  } else {
    return JSON.stringify({
      ...message,
      escrowAddress: message.escrowAddress.toLowerCase(),
    });
  }
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