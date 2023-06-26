import { ConfigType, registerAs } from "@nestjs/config";

export const ethereumConfig = registerAs("ethereum", () => ({
  jsonRpcUrl: process.env.JSON_RPC_URL || "",
  privateKey: process.env.PRIVATE_KEY || "",
}));
export const ethereumConfigKey = ethereumConfig.KEY;
export type EthereumConfigType = ConfigType<typeof ethereumConfig>;
