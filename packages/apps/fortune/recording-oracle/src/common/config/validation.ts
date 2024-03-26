import * as Joi from 'joi';

export const ConfigNames = {
  NODE_ENV: 'NODE_ENV',
  HOST: 'HOST',
  PORT: 'PORT',
  SESSION_SECRET: 'SESSION_SECRET',
  WEB3_PRIVATE_KEY: 'WEB3_PRIVATE_KEY',
  S3_ENDPOINT: 'S3_ENDPOINT',
  S3_PORT: 'S3_PORT',
  S3_ACCESS_KEY: 'S3_ACCESS_KEY',
  S3_SECRET_KEY: 'S3_SECRET_KEY',
  S3_BUCKET: 'S3_BUCKET',
  S3_USE_SSL: 'S3_USE_SSL',
  PGP_ENCRYPT: 'PGP_ENCRYPT',
  PGP_PRIVATE_KEY: 'PGP_PRIVATE_KEY',
  PGP_PASSPHRASE: 'PGP_PASSPHRASE',
};

export const envValidator = Joi.object({
  // General
  NODE_ENV: Joi.string().default('development'),
  HOST: Joi.string().default('localhost'),
  PORT: Joi.string().default(5000),
  SESSION_SECRET: Joi.string().default('session_key'),
  // Web3
  WEB3_PRIVATE_KEY: Joi.string().required(),
  // S3
  S3_ENDPOINT: Joi.string().default('127.0.0.1'),
  S3_PORT: Joi.string().default(9000),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string().default('solution'),
  S3_USE_SSL: Joi.string().default(false),
  // Encryption
  PGP_ENCRYPT: Joi.boolean().default(false),
  PGP_PRIVATE_KEY: Joi.string().optional(),
  PGP_PASSPHRASE: Joi.string().optional(),
});
