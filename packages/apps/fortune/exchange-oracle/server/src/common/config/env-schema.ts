import * as Joi from 'joi';

export const envValidator = Joi.object({
  // General
  NODE_ENV: Joi.string(),
  HOST: Joi.string(),
  PORT: Joi.string(),
  MAX_RETRY_COUNT: Joi.number(),
  CRON_SECRET: Joi.string().required(),
  // Database
  POSTGRES_HOST: Joi.string(),
  POSTGRES_USER: Joi.string(),
  POSTGRES_PASSWORD: Joi.string(),
  POSTGRES_DATABASE: Joi.string(),
  POSTGRES_PORT: Joi.string(),
  POSTGRES_SSL: Joi.string(),
  POSTGRES_LOGGING: Joi.string(),
  // Web3
  WEB3_ENV: Joi.string(),
  WEB3_PRIVATE_KEY: Joi.string().required(),
  POLYGON_RPC_URL: Joi.string(),
  BSC_RPC_URL: Joi.string(),
  AMOY_RPC_URL: Joi.string(),
  GOERLI_RPC_URL: Joi.string(),
  SEPOLIA_RPC_URL: Joi.string(),
  MOONBEAM_RPC_URL: Joi.string(),
  BSC_TESTNET_RPC_URL: Joi.string(),
  LOCALHOST_RPC_URL: Joi.string(),
  // S3
  S3_ENDPOINT: Joi.string(),
  S3_PORT: Joi.string(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string(),
  S3_USE_SSL: Joi.string(),
  // PGP
  PGP_ENCRYPT: Joi.boolean(),
  PGP_PRIVATE_KEY: Joi.string(),
  PGP_PASSPHRASE: Joi.string(),
});
