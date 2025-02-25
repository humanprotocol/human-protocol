import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthConfigService } from './auth-config.service';
import { ServerConfigService } from './server-config.service';
import { DatabaseConfigService } from './database-config.service';
import { PGPConfigService } from './pgp-config.service';
import { S3ConfigService } from './s3-config.service';
import { EmailConfigService } from './email-config.service';
import { Web3ConfigService } from './web3-config.service';
import { ReputationConfigService } from './reputation-config.service';
import { KycConfigService } from './kyc-config.service';
import { NetworkConfigService } from './network-config.service';
import { HCaptchaConfigService } from './hcaptcha-config.service';

@Global()
@Module({
  providers: [
    ConfigService,
    ServerConfigService,
    AuthConfigService,
    DatabaseConfigService,
    Web3ConfigService,
    S3ConfigService,
    ReputationConfigService,
    EmailConfigService,
    KycConfigService,
    PGPConfigService,
    NetworkConfigService,
    HCaptchaConfigService,
  ],
  exports: [
    ConfigService,
    ServerConfigService,
    AuthConfigService,
    DatabaseConfigService,
    Web3ConfigService,
    S3ConfigService,
    ReputationConfigService,
    EmailConfigService,
    KycConfigService,
    PGPConfigService,
    NetworkConfigService,
    HCaptchaConfigService,
  ],
})
export class EnvConfigModule {}
