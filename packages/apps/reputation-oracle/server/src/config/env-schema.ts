import * as Joi from 'joi';
import { Web3Network } from './web3-config.service';

export const envValidator = Joi.object({
  // General
  HOST: Joi.string(),
  PORT: Joi.number().integer(),
  FE_URL: Joi.string(),
  MAX_RETRY_COUNT: Joi.number().integer().min(0),
  QUALIFICATION_MIN_VALIDITY: Joi.number()
    .integer()
    .min(1)
    .description('Minimum qualification validity period (in days)'),
  NDA_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  // Auth
  JWT_PRIVATE_KEY: Joi.string().required(),
  JWT_PUBLIC_KEY: Joi.string().required(),
  JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.number().integer().min(1),
  JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.number().integer().min(1),
  VERIFY_EMAIL_TOKEN_EXPIRES_IN: Joi.number().integer().min(1),
  FORGOT_PASSWORD_TOKEN_EXPIRES_IN: Joi.number().integer().min(1),
  // hCaptcha
  HCAPTCHA_SITE_KEY: Joi.string().required(),
  HCAPTCHA_SECRET: Joi.string().required(),
  HCAPTCHA_PROTECTION_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .description('Hcaptcha URL for verifying guard tokens'),
  HCAPTCHA_LABELING_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .description('Hcaptcha labeling url'),
  HCAPTCHA_API_KEY: Joi.string()
    .required()
    .description('Account api key at hcaptcha foundation'),
  HCAPTCHA_DEFAULT_LABELER_LANG: Joi.string(),
  // Database
  POSTGRES_HOST: Joi.string(),
  POSTGRES_USER: Joi.string(),
  POSTGRES_PASSWORD: Joi.string(),
  POSTGRES_DATABASE: Joi.string(),
  POSTGRES_PORT: Joi.number().integer(),
  POSTGRES_SSL: Joi.string().valid('true', 'false'),
  POSTGRES_URL: Joi.string(),
  POSTGRES_LOGGING: Joi.string(),
  // Web3
  WEB3_ENV: Joi.string().valid(...Object.values(Web3Network)),
  WEB3_PRIVATE_KEY: Joi.string().required(),
  GAS_PRICE_MULTIPLIER: Joi.number().positive(),
  RPC_URL_SEPOLIA: Joi.string().uri({ scheme: ['http', 'https'] }),
  RPC_URL_POLYGON: Joi.string().uri({ scheme: ['http', 'https'] }),
  RPC_URL_POLYGON_AMOY: Joi.string().uri({ scheme: ['http', 'https'] }),
  RPC_URL_BSC_MAINNET: Joi.string().uri({ scheme: ['http', 'https'] }),
  RPC_URL_BSC_TESTNET: Joi.string().uri({ scheme: ['http', 'https'] }),
  RPC_URL_AURORA_TESTNET: Joi.string().uri({ scheme: ['http', 'https'] }),
  RPC_URL_MOONBEAM: Joi.string().uri({ scheme: ['http', 'https'] }),
  RPC_URL_XLAYER_TESTNET: Joi.string().uri({ scheme: ['http', 'https'] }),
  RPC_URL_XLAYER: Joi.string().uri({ scheme: ['http', 'https'] }),
  RPC_URL_LOCALHOST: Joi.string(),
  // S3
  S3_ENDPOINT: Joi.string(),
  S3_PORT: Joi.number().integer(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string(),
  S3_USE_SSL: Joi.string().valid('true', 'false'),
  // Email
  SENDGRID_API_KEY: Joi.string(),
  EMAIL_FROM: Joi.string().email(),
  EMAIL_FROM_NAME: Joi.string(),
  // Reputation Level
  REPUTATION_LEVEL_LOW: Joi.number(),
  REPUTATION_LEVEL_HIGH: Joi.number(),
  // Encryption
  PGP_PRIVATE_KEY: Joi.string().required(),
  PGP_PASSPHRASE: Joi.string().required(),
  PGP_ENCRYPT: Joi.string().valid('true', 'false'),
  // Kyc
  KYC_API_KEY: Joi.string(),
  KYC_API_PRIVATE_KEY: Joi.string().required(),
  KYC_BASE_URL: Joi.string().uri({ scheme: ['http', 'https'] }),
  // Human App
  HUMAN_APP_SECRET_KEY: Joi.string().required(),
  // Slack notifications
  ABUSE_SLACK_WEBHOOK_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  ABUSE_SLACK_OAUTH_TOKEN: Joi.string().required(),
  ABUSE_SLACK_SIGNING_SECRET: Joi.string().required(),
});
