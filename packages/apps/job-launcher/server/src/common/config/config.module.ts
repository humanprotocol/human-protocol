import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthConfigService } from './auth-config.service';
import { CommonConfigService } from './common-config.service';
import { CvatConfigService } from './cvat-config.service';
import { DatabaseConfigService } from './database-config.service';
import { PGPConfigService } from './pgp-config.service';
import { S3ConfigService } from './s3-config.service';
import { SendgridConfigService } from './sendgrid-config.service';
import { StripeConfigService } from './stripe-config.service';
import { Web3ConfigService } from './web3-config.service';

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
