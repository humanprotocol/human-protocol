import { ConfigType, registerAs } from '@nestjs/config';

export const serverConfig = registerAs('server', () => ({
  host: process.env.HOST!,
  port: +process.env.PORT!,
  sessionSecret: process.env.SESSION_SECRET!,
}));
export const serverConfigKey = serverConfig.KEY;
export type ServerConfigType = ConfigType<typeof serverConfig>;
