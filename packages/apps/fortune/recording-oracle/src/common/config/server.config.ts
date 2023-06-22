import { ConfigType, registerAs } from "@nestjs/config";

export const serverConfig = registerAs("server", () => ({
  host: process.env.HOST || "localhost",
  port: +(process.env.PORT || "5001"),
  sessionSecret: process.env.SESSION_SECRET || "secret",
  feUrl: process.env.FE_URL || "http://localhost:3001",
}));
export const serverConfigKey = serverConfig.KEY;
export type ServerConfigType = ConfigType<typeof serverConfig>;
