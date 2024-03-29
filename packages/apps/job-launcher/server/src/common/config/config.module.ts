import { Module, Global } from '@nestjs/common';
import {
  CommonConfigService,
  AuthConfigService,
  DatabaseConfigService,
  Web3ConfigService,
  S3ConfigService,
  StripeConfigService,
  SendgridConfigService,
  CvatConfigService,
  PGPConfigService,
} from './env';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    ConfigService,
    CommonConfigService,
    AuthConfigService,
    DatabaseConfigService,
    Web3ConfigService,
    S3ConfigService,
    StripeConfigService,
    SendgridConfigService,
    CvatConfigService,
    PGPConfigService,
  ],
  exports: [
    ConfigService,
    CommonConfigService,
    AuthConfigService,
    DatabaseConfigService,
    Web3ConfigService,
    S3ConfigService,
    StripeConfigService,
    SendgridConfigService,
    CvatConfigService,
    PGPConfigService,
  ],
})
export class EnvConfigModule {}
