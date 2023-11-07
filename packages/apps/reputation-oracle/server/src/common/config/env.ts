import * as Joi from 'joi';

export const ConfigNames = {
  NODE_ENV: 'NODE_ENV',
  HOST: 'HOST',
  PORT: 'PORT',
  FE_URL: 'FE_URL',
  SESSION_SECRET: 'SESSION_SECRET',
  HASH_SECRET: 'HASH_SECRET',
  JWT_SECRET: 'JWT_SECRET',
  JWT_ACCESS_TOKEN_EXPIRES_IN: 'JWT_ACCESS_TOKEN_EXPIRES_IN',
  JWT_REFRESH_TOKEN_EXPIRES_IN: 'JWT_REFRESH_TOKEN_EXPIRES_IN',
  POSTGRES_HOST: 'POSTGRES_HOST',
  POSTGRES_USER: 'POSTGRES_USER',
  POSTGRES_PASSWORD: 'POSTGRES_PASSWORD',
  POSTGRES_DATABASE: 'POSTGRES_DATABASE',
  POSTGRES_PORT: 'POSTGRES_PORT',
  POSTGRES_SYNC: 'POSTGRES_SYNC',
  POSTGRES_SSL: 'POSTGRES_SSL',
  WEB3_PRIVATE_KEY: 'WEB3_PRIVATE_KEY',
  S3_ENDPOINT: 'S3_ENDPOINT',
  S3_PORT: 'S3_PORT',
  S3_ACCESS_KEY: 'S3_ACCESS_KEY',
  S3_SECRET_KEY: 'S3_SECRET_KEY',
  S3_BUCKET: 'S3_BUCKET',
  S3_USE_SSL: 'S3_USE_SSL',
  SENDGRID_API_KEY: 'SENDGRID_API_KEY',
  SENDGRID_FROM_EMAIL: 'SENDGRID_FROM_EMAIL',
  SENDGRID_FROM_NAME: 'SENDGRID_FROM_NAME',
  REPUTATION_LEVEL_LOW: 'REPUTATION_LEVEL_LOW',
  REPUTATION_LEVEL_HIGH: 'REPUTATION_LEVEL_HIGH',
};

export const envValidator = Joi.object({
  // General
  NODE_ENV: Joi.string().default('development'),
  HOST: Joi.string().default('localhost'),
  PORT: Joi.string().default(5000),
  FE_URL: Joi.string().default('http://localhost:3001'),
  SESSION_SECRET: Joi.string().default('session_key'),
  // Auth
  HASH_SECRET: Joi.string().default('a328af3fc1dad15342cc3d68936008fa'),
  JWT_SECRET: Joi.string().default('secret'),
  JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.string().default(1000000000),
  JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.string().default(1000000000),
  // Database
  DB_TYPE: Joi.string().default('postgres'),
  POSTGRES_HOST: Joi.string().default('127.0.0.1'),
  POSTGRES_USER: Joi.string().default('operator'),
  POSTGRES_PASSWORD: Joi.string().default('qwerty'),
  POSTGRES_DATABASE: Joi.string().default('reputation-oracle'),
  POSTGRES_PORT: Joi.string().default('5432'),
  POSTGRES_SYNC: Joi.string().default('false'),
  POSTGRES_SSL: Joi.string().default('false'),
  // Web3
  WEB3_PRIVATE_KEY: Joi.string().required(),
  // S3
  S3_ENDPOINT: Joi.string().default('127.0.0.1'),
  S3_PORT: Joi.string().default(9000),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string().default('reputation'),
  S3_USE_SSL: Joi.string().default(false),
  // SendGrid
  SENDGRID_API_KEY: Joi.string().required(),
  SENDGRID_FROM_EMAIL: Joi.string().default('reputation-oracle@hmt.ai'),
  SENDGRID_FROM_NAME: Joi.string().default('Human Protocol Reputation Oracle'),
  // Reputation Level
  REPUTATION_LEVEL_LOW: Joi.number().default(300),
  REPUTATION_LEVEL_HIGH: Joi.number().default(700),
});
