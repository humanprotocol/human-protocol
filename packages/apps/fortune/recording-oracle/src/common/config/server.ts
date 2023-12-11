import { ConfigType, registerAs } from '@nestjs/config';

export const serverConfig = registerAs('server', () => ({
  host: process.env.HOST!,
  port: +process.env.PORT!,
  sessionSecret: process.env.SESSION_SECRET!,
  reputationOracleWebhookUrl: process.env.REPUTATION_ORACLE_WEBHOOK_URL!,
  encryptionPrivateKey: process.env.ENCRYPTION_PRIVATE_KEY!,
  encryptionPassphrase: process.env.ENCRYPTION_PASSPHRASE!,
}));
export const serverConfigKey = serverConfig.KEY;
export type ServerConfigType = ConfigType<typeof serverConfig>;
