import { ethers } from 'ethers';

export function verifySignature(
  message: object | string,
  signature: string,
  addresses: string[],
): boolean {
  const signer = recoverSigner(message, signature);

  return addresses.some(
    (address) => address.toLowerCase() === signer.toLowerCase(),
  );
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
    return '';
  }
}

export function generateNonce(): string {
  return Buffer.from(ethers.randomBytes(16)).toString('hex');
}

type SignatureBody = {
  from: string;
  to: string;
  contents: string;
  nonce?: string;
};
export function prepareSignatureBody({
  from,
  to,
  contents,
  nonce,
}: SignatureBody): SignatureBody {
  return {
    from: from.toLowerCase(),
    to: to.toLowerCase(),
    contents,
    nonce: nonce ?? undefined,
  };
}
