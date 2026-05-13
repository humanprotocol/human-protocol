import { Raw } from 'typeorm';

export function caseInsensitiveAddress(address: string) {
  return Raw((addressAlias) => `LOWER(${addressAlias}) = LOWER(:address)`, {
    address,
  });
}
