import { randomBytes } from 'crypto';
import { keccak256 } from 'js-sha3';

function generateRandomEthAddress(): string {
  const privateKey = randomBytes(32);
  const publicKey = Buffer.from(keccak256.arrayBuffer(privateKey)).slice(-20);
  return `0x${publicKey.toString('hex')}`;
}

export { generateRandomEthAddress };
