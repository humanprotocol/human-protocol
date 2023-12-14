import * as crypto from 'crypto';
import { promisify } from 'util';

export const pbkdf2Async = promisify(crypto.pbkdf2);

export async function generateHash(
  password: string,
  salt: string,
  iterations: number,
  keyLength: number,
): Promise<string> {
  const hash = (
    await pbkdf2Async(password, salt, iterations, keyLength, 'sha512')
  ).toString('hex');
  return hash;
}
