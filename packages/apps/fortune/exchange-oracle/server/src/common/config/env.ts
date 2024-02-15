import * as Joi from 'joi';

export const ConfigNames = {
  HOST: 'HOST',
  PORT: 'PORT',
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
  RECORDING_ORACLE_ADDRESS: 'RECORDING_ORACLE_ADDRESS',
};

export const envValidator = Joi.object({
  HOST: Joi.string().default('localhost'),
  PORT: Joi.string().default(3002),
  WEB3_PRIVATE_KEY: Joi.string().required(),
  // S3
  S3_ENDPOINT: Joi.string().default('127.0.0.1'),
  S3_PORT: Joi.string().default(9000),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string().default('solution'),
  S3_USE_SSL: Joi.string().default(false),
  PGP_ENCRYPT: Joi.boolean().default(false),
  PGP_PRIVATE_KEY: Joi.string().default(''),
  PGP_PASSPHRASE: Joi.string().default(''),
  RECORDING_ORACLE_ADDRESS: Joi.string().required(),
});
