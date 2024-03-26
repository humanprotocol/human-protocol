import * as Joi from 'joi';

export const ConfigNames = {
  NODE_ENV: 'NODE_ENV',
  HOST: 'HOST',
  PORT: 'PORT',
  WEB3_ENV: 'WEB3_ENV',
  POSTGRES_URL: 'POSTGRES_URL',
  POSTGRES_HOST: 'POSTGRES_HOST',
  POSTGRES_USER: 'POSTGRES_USER',
  POSTGRES_PASSWORD: 'POSTGRES_PASSWORD',
  POSTGRES_DATABASE: 'POSTGRES_DATABASE',
  POSTGRES_PORT: 'POSTGRES_PORT',
  POSTGRES_SYNC: 'POSTGRES_SYNC',
  POSTGRES_SSL: 'POSTGRES_SSL',
  POSTGRES_LOGGING: 'POSTGRES_LOGGING',
  MAX_RETRY_COUNT: 'MAX_RETRY_COUNT',
  WEB3_PRIVATE_KEY: 'WEB3_PRIVATE_KEY',
  S3_ENDPOINT: 'S3_ENDPOINT',
  S3_PORT: 'S3_PORT',
  S3_ACCESS_KEY: 'S3_ACCESS_KEY',
  S3_SECRET_KEY: 'S3_SECRET_KEY',
  S3_BUCKET: 'S3_BUCKET',
  S3_USE_SSL: 'S3_USE_SSL',
  PGP_ENCRYPT: 'PGP_ENCRYPT',
  PGP_PRIVATE_KEY: 'ENCRYPTION_PRIVATE_KEY',
  PGP_PASSPHRASE: 'PGP_PASSPHRASE',
  CRON_SECRET: 'CRON_SECRET',
};

export const envValidator = Joi.object({
  // General
  NODE_ENV: Joi.string().default('development'),
  HOST: Joi.string().default('localhost'),
  PORT: Joi.string().default(3002),
  MAX_RETRY_COUNT: Joi.number().default(5),
  WEB3_ENV: Joi.string().default('testnet'),
  // Database
  DB_TYPE: Joi.string().default('postgres'),
  POSTGRES_URL: Joi.string().optional(),
  POSTGRES_HOST: Joi.string().optional(),
  POSTGRES_USER: Joi.string().optional(),
  POSTGRES_PASSWORD: Joi.string().optional(),
  POSTGRES_DATABASE: Joi.string().optional(),
  POSTGRES_PORT: Joi.string().optional(),
  POSTGRES_SYNC: Joi.string().default('false'),
  POSTGRES_SSL: Joi.string().default('false'),
  POSTGRES_LOGGING: Joi.string(),
  // Web3
  WEB3_PRIVATE_KEY: Joi.string().required(),
  // S3
  S3_ENDPOINT: Joi.string().default('127.0.0.1'),
  S3_PORT: Joi.string().default(9000),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string().default('solution'),
  S3_USE_SSL: Joi.string().default(false),
  PGP_ENCRYPT: Joi.boolean().default(false),
  PGP_PRIVATE_KEY: Joi.string().optional(),
  PGP_PASSPHRASE: Joi.string().optional(),
  // Cron Job Secret
  CRON_SECRET: Joi.string().optional(),
});
