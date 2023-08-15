import * as Joi from 'joi';

export const ConfigNames = {
  NODE_ENV: 'NODE_ENV',
  HOST: 'HOST',
  PORT: 'PORT',
  FE_URL: 'FE_URL',
  SESSION_SECRET: 'SESSION_SECRET',
  WEB3_PRIVATE_KEY: 'WEB3_PRIVATE_KEY',
  REPUTATION_ORACLE_WEBHOOK_URL: 'REPUTATION_ORACLE_WEBHOOK_URL',
  S3_ENDPOINT: 'S3_ENDPOINT',
  S3_PORT: 'S3_PORT',
  S3_ACCESS_KEY: 'S3_ACCESS_KEY',
  S3_SECRET_KEY: 'S3_SECRET_KEY',
  S3_BACKET: 'S3_BACKET',
  S3_USE_SSL: 'S3_USE_SSL',
};

export const envValidator = Joi.object({
  // General
  NODE_ENV: Joi.string().default('development'),
  HOST: Joi.string().default('localhost'),
  PORT: Joi.string().default(5000),
  FE_URL: Joi.string().default('http://localhost:3001'),
  SESSION_SECRET: Joi.string().default('session_key'),
  // Web3
  WEB3_PRIVATE_KEY: Joi.string().required(),
  REPUTATION_ORACLE_WEBHOOK_URL: Joi.string().default('http://localhost:4005'),
  // S3
  S3_ENDPOINT: Joi.string().default('127.0.0.1'),
  S3_PORT: Joi.string().default(9000),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BACKET: Joi.string().default('solution'),
  S3_USE_SSL: Joi.string().default(false),
});
