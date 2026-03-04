import { BigInt, Bytes } from '@graphprotocol/graph-ts';

export function generateUniqueHash(
  value: string,
  timestamp: BigInt,
  nonce: BigInt
): Bytes {
  const uniqueString =
    value + '-' + timestamp.toString() + '-' + nonce.toString();
  return Bytes.fromUTF8(uniqueString);
}
