import { ConfigType, registerAs } from "@nestjs/config";

export const storageConfig = registerAs("storage", () => ({
  accessKey: process.env.STORAGE_ACCESS_KEY || "",
  secretKey: process.env.STORAGE_SECRET_KEY || "",
  endPoint: process.env.STORAGE_ENDPOINT || "",
  port: +(process.env.STORAGE_PORT || "9000"),
  useSSL: process.env.STORAGE_USE_SSL === "true",
  bucket: process.env.STORAGE_BUCKET || "",
}));
export const storageConfigKey = storageConfig.KEY;
export type StorageConfigType = ConfigType<typeof storageConfig>;
