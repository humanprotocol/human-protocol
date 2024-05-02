import * as Joi from 'joi';

export const envValidator = Joi.object({
  // Web3
  WEB3_ENV: Joi.string().required(),
  WEB3_GAS_PRICE_MULTIPLIER: Joi.string().required(),
  WEB3_PRIVATE_KEY: Joi.string().required(),
  WEB3_HOT_WALLET_ADDRESS: Joi.string().required(),
  // Limits
  HMT_TOKEN_MIN_BALANCE_REFILL_WALLET: Joi.number().required(),
  HMT_TOKEN_MAX_BALANCE_REFILL_WALLET: Joi.number().required(),
  HMT_TOKEN_DAILY_LIMIT_REFILL_WALLET: Joi.number().required(),
  NATIVE_TOKEN_MIN_BALANCE_REFILL_WALLET: Joi.number().required(),
  NATIVE_TOKEN_MAX_BALANCE_REFILL_WALLET: Joi.number().required(),
  NATIVE_TOKEN_DAILY_LIMIT_REFILL_WALLET: Joi.number().required(),
  HMT_TOKEN_MIN_BALANCE_HOT_WALLET: Joi.number().required(),
  HMT_TOKEN_MAX_BALANCE_HOT_WALLET: Joi.number().required(),
  HMT_TOKEN_DAILY_LIMIT_HOT_WALLET: Joi.number().required(),
  NATIVE_TOKEN_MIN_BALANCE_HOT_WALLET: Joi.number().required(),
  NATIVE_TOKEN_MAX_BALANCE_HOT_WALLET: Joi.number().required(),
  NATIVE_TOKEN_DAILY_LIMIT_HOT_WALLET: Joi.number().required(),
  // S3
  S3_ENDPOINT: Joi.string().required(),
  S3_PORT: Joi.string().required(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string().required(),
  S3_USE_SSL: Joi.string().required(),
  //PGP
  PGP_PRIVATE_KEY: Joi.string().required(),
  // Notifications
  SLACK_WEBHOOK_URL: Joi.string().required(),
});

/**
 * Service for managing configuration settings.
 */
export class ConfigService {
  constructor() {
    const { error } = envValidator.validate(process.env, {
      allowUnknown: true,
    });

    if (error) {
      throw new Error(`Validation error: ${error.message}`);
    }
  }

  get pgpPrivateKey(): string {
    return process.env.PGP_PRIVATE_KEY!;
  }
  get pgpPublicKey(): string {
    return process.env.PGP_PUBLIC_KEY!;
  }
  get s3Endpoint(): string {
    return process.env.S3_ENDPOINT!;
  }
  get s3Port(): number {
    return +process.env.S3_PORT!;
  }
  get s3AccessKey(): string {
    return process.env.S3_ACCESS_KEY!;
  }
  get s3SecretKey(): string {
    return process.env.S3_SECRET_KEY!;
  }
  get s3Bucket(): string {
    return process.env.S3_BUCKET!;
  }

  get s3UseSSL(): boolean {
    return process.env.S3_USE_SSL! === 'true';
  }

  get web3Env(): string {
    return process.env.WEB3_ENV!;
  }

  get web3GasPriceMultiplier(): number {
    return +process.env.WEB3_GAS_PRICE_MULTIPLIER!;
  }

  get web3PrivateKey(): string {
    return process.env.WEB3_PRIVATE_KEY!;
  }

  get web3HotWalletAddress(): string {
    return process.env.WEB3_HOT_WALLET_ADDRESS!;
  }

  get hmtTokenMinBalanceRefillWallet(): bigint {
    return BigInt(process.env.HMT_TOKEN_MIN_BALANCE_REFILL_WALLET!);
  }

  get hmtTokenMaxBalanceRefillWallet(): bigint {
    return BigInt(process.env.HMT_TOKEN_MAX_BALANCE_REFILL_WALLET!);
  }

  get hmtTokenDailyLimitRefillWallet(): bigint {
    return BigInt(process.env.HMT_TOKEN_DAILY_LIMIT_REFILL_WALLET!);
  }

  get nativeTokenMinBalanceRefillWallet(): bigint {
    return BigInt(process.env.NATIVE_TOKEN_MIN_BALANCE_REFILL_WALLET!);
  }

  get nativeTokenMaxBalanceRefillWallet(): bigint {
    return BigInt(process.env.NATIVE_TOKEN_MAX_BALANCE_REFILL_WALLET!);
  }

  get nativeTokenDailyLimitRefillWallet(): bigint {
    return BigInt(process.env.NATIVE_TOKEN_DAILY_LIMIT_REFILL_WALLET!);
  }

  get hmtTokenMinBalanceHotWallet(): bigint {
    return BigInt(process.env.HMT_TOKEN_MIN_BALANCE_HOT_WALLET!);
  }

  get hmtTokenMaxBalanceHotWallet(): bigint {
    return BigInt(process.env.HMT_TOKEN_MAX_BALANCE_HOT_WALLET!);
  }

  get hmtTokenDailyLimitHotWallet(): bigint {
    return BigInt(process.env.HMT_TOKEN_DAILY_LIMIT_HOT_WALLET!);
  }

  get nativeTokenMinBalanceHotWallet(): bigint {
    return BigInt(process.env.NATIVE_TOKEN_MIN_BALANCE_HOT_WALLET!);
  }

  get nativeTokenMaxBalanceHotWallet(): bigint {
    return BigInt(process.env.NATIVE_TOKEN_MAX_BALANCE_HOT_WALLET!);
  }

  get nativeTokenDailyLimitHotWallet(): bigint {
    return BigInt(process.env.NATIVE_TOKEN_DAILY_LIMIT_HOT_WALLET!);
  }

  get slackWebhookUrl(): string {
    return process.env.SLACK_WEBHOOK_URL!;
  }
}
