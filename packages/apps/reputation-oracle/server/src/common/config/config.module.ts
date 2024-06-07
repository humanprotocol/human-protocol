import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthConfigService } from './auth-config.service';
import { ServerConfigService } from './server-config.service';
import { DatabaseConfigService } from './database-config.service';
import { PGPConfigService } from './pgp-config.service';
import { S3ConfigService } from './s3-config.service';
import { SendgridConfigService } from './sendgrid-config.service';
import { Web3ConfigService } from './web3-config.service';
import { ReputationConfigService } from './reputation-config.service';
import { SynapsConfigService } from './synaps-config.service';
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
    SendgridConfigService,
    SynapsConfigService,
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
    SendgridConfigService,
    SynapsConfigService,
    PGPConfigService,
    NetworkConfigService,
    HCaptchaConfigService,
  ],
})
export class EnvConfigModule {}
