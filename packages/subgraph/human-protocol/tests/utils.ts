import { Bytes, BigInt } from '@graphprotocol/graph-ts';

export function generateUniqueHash(
  address: string,
  timestamp: BigInt,
  nonce: BigInt
): Bytes {
  const uniqueString =
    address + '-' + timestamp.toString() + '-' + nonce.toString();
  return Bytes.fromUTF8(uniqueString);
}
