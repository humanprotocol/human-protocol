import * as Joi from 'joi';

export const envValidator = Joi.object({
  // General
  NODE_ENV: Joi.string(),
  HOST: Joi.string(),
  PORT: Joi.string(),
  FE_URL: Joi.string(),
  SESSION_SECRET: Joi.string(),
  MAX_RETRY_COUNT: Joi.number(),
  // Auth
  JWT_PRIVATE_KEY: Joi.string().required(),
  JWT_PUBLIC_KEY: Joi.string().required(),
  JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.number(),
  REFRESH_TOKEN_EXPIRES_IN: Joi.number(),
  VERIFY_EMAIL_TOKEN_EXPIRES_IN: Joi.number(),
  FORGOT_PASSWORD_TOKEN_EXPIRES_IN: Joi.number(),
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
  REPUTATION_ORACLE_ADDRESS: Joi.string().required(),
  FORTUNE_EXCHANGE_ORACLE_ADDRESS: Joi.string().required(),
  FORTUNE_RECORDING_ORACLE_ADDRESS: Joi.string().required(),
  CVAT_EXCHANGE_ORACLE_ADDRESS: Joi.string().required(),
  CVAT_RECORDING_ORACLE_ADDRESS: Joi.string().required(),
  HCAPTCHA_RECORDING_ORACLE_URI: Joi.string().required(),
  HCAPTCHA_REPUTATION_ORACLE_URI: Joi.string().required(),
  HCAPTCHA_ORACLE_ADDRESS: Joi.string().required(),
  HCAPTCHA_SITE_KEY: Joi.string().required(),
  // HCAPTCHA_SECRET: Joi.string().required(),
  HCAPTCHA_EXCHANGE_URL: Joi.string().description('hcaptcha exchange url'),
  // S3
  S3_ENDPOINT: Joi.string(),
  S3_PORT: Joi.string(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string(),
  S3_USE_SSL: Joi.string(),
  // Stripe
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_API_VERSION: Joi.string(),
  STRIPE_APP_NAME: Joi.string(),
  STRIPE_APP_VERSION: Joi.string(),
  STRIPE_APP_INFO_URL: Joi.string(),
  // SendGrid
  SENDGRID_API_KEY: Joi.string().required(),
  SENDGRID_FROM_EMAIL: Joi.string(),
  SENDGRID_FROM_NAME: Joi.string(),
  // CVAT
  CVAT_JOB_SIZE: Joi.string(),
  CVAT_VAL_SIZE: Joi.string(),
  //PGP
  PGP_ENCRYPT: Joi.boolean(),
  PGP_PRIVATE_KEY: Joi.string().optional(),
  PGP_PASSPHRASE: Joi.string().optional(),
  // APIKey
  APIKEY_ITERATIONS: Joi.number(),
  APIKEY_KEY_LENGTH: Joi.number(),
  // Cron Job Secret
  CRON_SECRET: Joi.string().required(),
});
