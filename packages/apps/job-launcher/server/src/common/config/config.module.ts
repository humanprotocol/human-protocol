import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthConfigService } from './auth-config.service';
import { ServerConfigService } from './server-config.service';
import { CvatConfigService } from './cvat-config.service';
import { DatabaseConfigService } from './database-config.service';
import { NetworkConfigService } from './network-config.service';
import { PGPConfigService } from './pgp-config.service';
import { S3ConfigService } from './s3-config.service';
import { SendgridConfigService } from './sendgrid-config.service';
import { PaymentProviderConfigService } from './payment-provider-config.service';
import { Web3ConfigService } from './web3-config.service';
import { SlackConfigService } from './slack-config.service';
import { VisionConfigService } from './vision-config.service';

@Global()
@Module({
  providers: [
    ConfigService,
    ServerConfigService,
    AuthConfigService,
    DatabaseConfigService,
    Web3ConfigService,
    S3ConfigService,
    PaymentProviderConfigService,
    SendgridConfigService,
    CvatConfigService,
    PGPConfigService,
    NetworkConfigService,
    SlackConfigService,
    VisionConfigService,
  ],
  exports: [
    ConfigService,
    ServerConfigService,
    AuthConfigService,
    DatabaseConfigService,
    Web3ConfigService,
    S3ConfigService,
    PaymentProviderConfigService,
    SendgridConfigService,
    CvatConfigService,
    PGPConfigService,
    NetworkConfigService,
    SlackConfigService,
    VisionConfigService,
  ],
})
export class EnvConfigModule {}
