import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

import { ConfigNames } from '../../common/config';

const configService = new ConfigService();

export function hashToken(token: string): string {
  const hash = createHash('sha256');
  console.log(configService.get<string>(ConfigNames.HASH_SECRET));
  hash.update(token + configService.get<string>(ConfigNames.HASH_SECRET));
  return hash.digest('hex');
}

export function compareToken(token: string, hashedToken: string): boolean {
  return hashToken(token) === hashedToken;
}
