import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ServerConfigService } from './server-config.service';
import { DatabaseConfigService } from './database-config.service';
import { PGPConfigService } from './pgp-config.service';
import { S3ConfigService } from './s3-config.service';
import { Web3ConfigService } from './web3-config.service';
import { NetworkConfigService } from './network-config.service';

@Global()
@Module({
  providers: [
    ConfigService,
    ServerConfigService,
    DatabaseConfigService,
    Web3ConfigService,
    S3ConfigService,
    PGPConfigService,
    NetworkConfigService,
  ],
  exports: [
    ConfigService,
    ServerConfigService,
    DatabaseConfigService,
    Web3ConfigService,
    S3ConfigService,
    PGPConfigService,
    NetworkConfigService,
  ],
})
export class EnvConfigModule {}
