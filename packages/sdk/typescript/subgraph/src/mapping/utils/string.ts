import { Bytes } from '@graphprotocol/graph-ts';

export const toBytes = (str: string): Bytes => {
  return Bytes.fromUTF8(str);
};
