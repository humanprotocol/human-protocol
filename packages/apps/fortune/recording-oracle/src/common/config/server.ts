import { ConfigType, registerAs } from '@nestjs/config';

export const serverConfig = registerAs('server', () => ({
  host: process.env.HOST || 'localhost',
  port: +(process.env.PORT || 5000),
  sessionSecret: process.env.SESSION_SECRET || 'session_key',
  reputationOracleAddress: process.env.REPUTATION_ORACLE_ADDRESS || '',
  reputationOracleWebhookUrl:
    process.env.REPUTATION_ORACLE_WEBHOOK_URL || 'http://localhost:4005',
  encryptionPrivateKey: process.env.ENCRYPTION_PRIVATE_KEY || '',
  encryptionPassphrase: process.env.ENCRYPTION_PASSPHRASE || '',
}));
export const serverConfigKey = serverConfig.KEY;
export type ServerConfigType = ConfigType<typeof serverConfig>;
