import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthConfigService } from './auth-config.service';
import { DatabaseConfigService } from './database-config.service';
import { EmailConfigService } from './email-config.service';
import { HCaptchaConfigService } from './hcaptcha-config.service';
import { KycConfigService } from './kyc-config.service';
import { NDAConfigService } from './nda-config.service';
import { PGPConfigService } from './pgp-config.service';
import { ReputationConfigService } from './reputation-config.service';
import { S3ConfigService } from './s3-config.service';
import { ServerConfigService } from './server-config.service';
import { Web3ConfigService } from './web3-config.service';
import { SlackConfigService } from './slack-config.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    AuthConfigService,
    DatabaseConfigService,
    EmailConfigService,
    HCaptchaConfigService,
    KycConfigService,
    NDAConfigService,
    PGPConfigService,
    ReputationConfigService,
    S3ConfigService,
    ServerConfigService,
    SlackConfigService,
    Web3ConfigService,
  ],
  exports: [
    AuthConfigService,
    DatabaseConfigService,
    EmailConfigService,
    HCaptchaConfigService,
    KycConfigService,
    NDAConfigService,
    PGPConfigService,
    ReputationConfigService,
    S3ConfigService,
    ServerConfigService,
    SlackConfigService,
    Web3ConfigService,
  ],
})
export class EnvConfigModule {}
