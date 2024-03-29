import * as Joi from 'joi';

export const envValidator = Joi.object({
  // General
  NODE_ENV: Joi.string().default('development'),
  HOST: Joi.string().default('localhost'),
  PORT: Joi.string().default(5000),
  FE_URL: Joi.string().default('http://localhost:3005'),
  SESSION_SECRET: Joi.string().default('session_key'),
  MAX_RETRY_COUNT: Joi.number().default(5),
  // Auth
  JWT_PRIVATE_KEY: Joi.string().required(),
  JWT_PUBLIC_KEY: Joi.string().required(),
  JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.number().default(300000),
  REFRESH_TOKEN_EXPIRES_IN: Joi.number().default(3600000),
  VERIFY_EMAIL_TOKEN_EXPIRES_IN: Joi.number().default(1800000),
  FORGOT_PASSWORD_TOKEN_EXPIRES_IN: Joi.number().default(1800000),
  // Database
  POSTGRES_HOST: Joi.string().default('127.0.0.1'),
  POSTGRES_USER: Joi.string().default('operator'),
  POSTGRES_PASSWORD: Joi.string().default('qwerty'),
  POSTGRES_DATABASE: Joi.string().default('job-launcher'),
  POSTGRES_PORT: Joi.string().default('5432'),
  POSTGRES_SSL: Joi.string().default('false'),
  POSTGRES_LOGGING: Joi.string(),
  // Web3
  WEB3_ENV: Joi.string().default('testnet'),
  WEB3_PRIVATE_KEY: Joi.string().required(),
  GAS_PRICE_MULTIPLIER: Joi.number().default(null),
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
  HCAPTCHA_EXCHANGE_URL: Joi.string()
    .default('https://foundation-exchange.hmt.ai')
    .description('hcaptcha exchange url'),
  // S3
  S3_ENDPOINT: Joi.string().default('127.0.0.1'),
  S3_PORT: Joi.string().default(9000),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string().default('launcher'),
  S3_USE_SSL: Joi.string().default('false'),
  // Stripe
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_API_VERSION: Joi.string().default('2022-11-15'),
  STRIPE_APP_NAME: Joi.string().default('Fortune'),
  STRIPE_APP_VERSION: Joi.string().default('0.0.1'),
  STRIPE_APP_INFO_URL: Joi.string().default('https://hmt.ai'),
  // SendGrid
  SENDGRID_API_KEY: Joi.string().required(),
  SENDGRID_FROM_EMAIL: Joi.string().default('job-launcher@hmt.ai'),
  SENDGRID_FROM_NAME: Joi.string().default('Human Protocol Job Launcher'),
  // CVAT
  CVAT_JOB_SIZE: Joi.string().default('10'),
  CVAT_MAX_TIME: Joi.string().default('300'),
  CVAT_VAL_SIZE: Joi.string().default('2'),
  //PGP
  PGP_ENCRYPT: Joi.boolean().default(false),
  PGP_PRIVATE_KEY: Joi.string().optional(),
  PGP_PASSPHRASE: Joi.string().optional(),
  // APIKey
  APIKEY_ITERATIONS: Joi.number().default(1000),
  APIKEY_KEY_LENGTH: Joi.number().default(64),
  // Cron Job Secret
  CRON_SECRET: Joi.string().required(),
});
