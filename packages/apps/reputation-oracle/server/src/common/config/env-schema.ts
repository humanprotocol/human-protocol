import * as Joi from 'joi';

export const envValidator = Joi.object({
  // General
  NODE_ENV: Joi.string(),
  HOST: Joi.string(),
  PORT: Joi.string(),
  FE_URL: Joi.string(),
  SESSION_SECRET: Joi.string(),
  MAX_RETRY_COUNT: Joi.number(),
  CRON_SECRET: Joi.string().required(),
  // Auth
  JWT_PRIVATE_KEY: Joi.string(),
  JWT_PUBLIC_KEY: Joi.string(),
  JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.number(),
  JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.number(),
  VERIFY_EMAIL_TOKEN_EXPIRES_IN: Joi.number(),
  FORGOT_PASSWORD_TOKEN_EXPIRES_IN: Joi.number(),
  HCAPTCHA_SITE_KEY: Joi.string().required(),
  HCAPTCHA_SECRET: Joi.string().required(),
  HCAPTCHA_EXCHANGE_URL: Joi.string().description('hcaptcha exchange url'),
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
  GAS_PRICE_MULTIPLIER: Joi.number(),
  // S3
  S3_ENDPOINT: Joi.string(),
  S3_PORT: Joi.string(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string(),
  S3_USE_SSL: Joi.string(),
  // SendGrid
  SENDGRID_API_KEY: Joi.string().required(),
  SENDGRID_FROM_EMAIL: Joi.string(),
  SENDGRID_FROM_NAME: Joi.string(),
  // Reputation Level
  REPUTATION_LEVEL_LOW: Joi.number(),
  REPUTATION_LEVEL_HIGH: Joi.number(),
  // Encryption
  PGP_PRIVATE_KEY: Joi.string(),
  PGP_PASSPHRASE: Joi.string(),
  PGP_ENCRYPT: Joi.string(),
  // Synaps Kyc
  SYNAPS_API_KEY: Joi.string().required(),
  SYNAPS_WEBHOOK_SECRET: Joi.string().required(),
});
