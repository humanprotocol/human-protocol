import { ConfigType, registerAs } from '@nestjs/config';

export const serverConfig = registerAs('server', () => ({
  host: process.env.HOST || 'localhost',
  port: +(process.env.PORT || 5000),
  sessionSecret: process.env.SESSION_SECRET || 'session_key',
  pgpEncrypt: process.env.PGP_ENCRYPT || false,
  encryptionPrivateKey: process.env.PGP_PRIVATE_KEY || '',
  encryptionPassphrase: process.env.PGP_PASSPHRASE || '',
}));
export const serverConfigKey = serverConfig.KEY;
export type ServerConfigType = ConfigType<typeof serverConfig>;
