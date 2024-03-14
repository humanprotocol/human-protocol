import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

@Injectable()
export class CommonConfigService {
  constructor(private configService: ConfigService) {}
  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }
  get host(): string {
    return this.configService.get<string>('HOST', 'localhost');
  }
  get port(): number {
    return this.configService.get<number>('PORT', 5000);
  }
  get feURL(): string {
    return this.configService.get<string>('FE_URL', 'http://localhost:3005');
  }
  get sessionSecret(): string {
    return this.configService.get<string>('SESSION_SECRET', 'session_key');
  }
  get maxRetryCount(): number {
    return this.configService.get<number>('MAX_RETRY_COUNT', 5);
  }
  get cronSecret(): string {
    return this.configService.get<string>('CRON_SECRET', '');
  }
}

@Injectable()
export class AuthConfigService {
  constructor(private configService: ConfigService) {}
  get jwtPrivateKey(): string {
    return this.configService.get<string>('JWT_PRIVATE_KEY', '');
  }
  get jwtPublicKey(): string {
    return this.configService.get<string>('JWT_PUBLIC_KEY', '');
  }
  get accessTokenExpiresIn(): number {
    return this.configService.get<number>(
      'JWT_ACCESS_TOKEN_EXPIRES_IN',
      300000,
    );
  }
  get refreshTokenExpiresIn(): number {
    return this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN', 3600000);
  }
  get verifyEmailTokenExpiresIn(): number {
    return this.configService.get<number>(
      'VERIFY_EMAIL_TOKEN_EXPIRES_IN',
      1800000,
    );
  }
  get forgotPasswordExpiresIn(): number {
    return this.configService.get<number>(
      'FORGOT_PASSWORD_TOKEN_EXPIRES_IN',
      1800000,
    );
  }
  get apiKeyIterations(): number {
    return this.configService.get<number>('APIKEY_ITERATIONS', 1000);
  }
  get apiKeyLength(): number {
    return this.configService.get<number>('APIKEY_KEY_LENGTH', 64);
  }
  get hCaptchaSiteKey(): string {
    return this.configService.get<string>('HCAPTCHA_SITE_KEY', '');
  }
  get hCaptchaSecret(): string {
    return this.configService.get<string>('HCAPTCHA_SECRET', '');
  }
  get hCaptchaExchangeURL(): string {
    return this.configService.get<string>(
      'HCAPTCHA_EXCHANGE_URL',
      'https://foundation-exchange.hmt.ai',
    );
  }
}

@Injectable()
export class DatabaseConfigService {
  constructor(private configService: ConfigService) {}
  get host(): string {
    return this.configService.get<string>('POSTGRES_HOST', '127.0.0.1');
  }
  get port(): number {
    return this.configService.get<number>('POSTGRES_PORT', 5432);
  }
  get user(): string {
    return this.configService.get<string>('POSTGRES_USER', 'operator');
  }
  get password(): string {
    return this.configService.get<string>('POSTGRES_PASSWORD', 'qwerty');
  }
  get database(): string {
    return this.configService.get<string>('POSTGRES_DATABASE', 'job-launcher');
  }
  get ssl(): boolean {
    return this.configService.get<string>('POSTGRES_SSL', 'false') === 'true';
  }
  get logging(): string {
    return this.configService.get<string>('POSTGRES_LOGGING', '');
  }
}

@Injectable()
export class Web3ConfigService {
  constructor(private configService: ConfigService) {}
  get env(): string {
    return this.configService.get<string>('WEB3_ENV', 'testnet');
  }
  get privateKey(): string {
    return this.configService.get<string>('WEB3_PRIVATE_KEY', '');
  }
  get gasPriceMultiplier(): number {
    return this.configService.get<number>('GAS_PRICE_MULTIPLIER', 1);
  }
  get reputationOracleAddress(): string {
    return this.configService.get<string>('REPUTATION_ORACLE_ADDRESS', '');
  }
  get fortuneExchangeOracleAddress(): string {
    return this.configService.get<string>(
      'FORTUNE_EXCHANGE_ORACLE_ADDRESS',
      '',
    );
  }
  get fortuneRecordingOracleAddress(): string {
    return this.configService.get<string>(
      'FORTUNE_RECORDING_ORACLE_ADDRESS',
      '',
    );
  }
  get cvatExchangeOracleAddress(): string {
    return this.configService.get<string>('CVAT_EXCHANGE_ORACLE_ADDRESS', '');
  }
  get cvatRecordingOracleAddress(): string {
    return this.configService.get<string>('CVAT_RECORDING_ORACLE_ADDRESS', '');
  }
  get hCaptchaRecordingOracleURI(): string {
    return this.configService.get<string>('HCAPTCHA_RECORDING_ORACLE_URI', '');
  }
  get hCaptchaReputationOracleURI(): string {
    return this.configService.get<string>('HCAPTCHA_REPUTATION_ORACLE_URI', '');
  }
  get hCaptchaOracleAddress(): string {
    return this.configService.get<string>('HCAPTCHA_ORACLE_ADDRESS', '');
  }
}

@Injectable()
export class S3ConfigService {
  constructor(private configService: ConfigService) {}
  get endpoint(): string {
    return this.configService.get<string>('S3_ENDPOINT', '127.0.0.1');
  }
  get port(): number {
    return this.configService.get<number>('S3_PORT', 9000);
  }
  get accessKey(): string {
    return this.configService.get<string>('S3_ACCESS_KEY', '');
  }
  get secretKey(): string {
    return this.configService.get<string>('S3_SECRET_KEY', '');
  }
  get bucket(): string {
    return this.configService.get<string>('S3_BUCKET', 'launcher');
  }
  get useSSL(): boolean {
    return this.configService.get<string>('S3_USE_SSL', 'false') === 'true';
  }
}

@Injectable()
export class StripeConfigService {
  constructor(private configService: ConfigService) {}
  get secretKey(): string {
    return this.configService.get<string>('STRIPE_SECRET_KEY', '127.0.0.1');
  }
  get apiVersion(): string {
    return this.configService.get<string>('STRIPE_API_VERSION', '2022-11-15');
  }
  get appName(): string {
    return this.configService.get<string>('STRIPE_APP_NAME', 'Fortune');
  }
  get appVersion(): string {
    return this.configService.get<string>('STRIPE_APP_VERSION', '0.0.1');
  }
  get appInfoURL(): string {
    return this.configService.get<string>(
      'STRIPE_APP_INFO_URL',
      'https://hmt.ai',
    );
  }
}

@Injectable()
export class SendgridConfigService {
  constructor(private configService: ConfigService) {}
  get apiKey(): string {
    return this.configService.get<string>('SENDGRID_API_KEY', '');
  }
  get fromEmail(): string {
    return this.configService.get<string>(
      'SENDGRID_FROM_EMAIL',
      'job-launcher@hmt.ai',
    );
  }
  get fromName(): string {
    return this.configService.get<string>(
      'SENDGRID_FROM_NAME',
      'Human Protocol Job Launcher',
    );
  }
}

@Injectable()
export class CvatConfigService {
  constructor(private configService: ConfigService) {}
  get jobSize(): number {
    return this.configService.get<number>('CVAT_JOB_SIZE', 10);
  }
  get maxTime(): number {
    return this.configService.get<number>('CVAT_MAX_TIME', 300);
  }
  get valSize(): number {
    return this.configService.get<number>('CVAT_VAL_SIZE', 2);
  }
}

@Injectable()
export class PGPConfigService {
  constructor(private configService: ConfigService) {}
  get encrypt(): boolean {
    return this.configService.get<string>('PGP_ENCRYPT', 'false') === 'true';
  }
  get privateKey(): string {
    return this.configService.get<string>('PGP_PRIVATE_KEY', '');
  }
  get passphrase(): string {
    return this.configService.get<string>('PGP_PASSPHRASE', '');
  }
}

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
