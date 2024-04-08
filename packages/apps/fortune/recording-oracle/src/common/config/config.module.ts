import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServerConfigService } from './server-config.service';
import { PGPConfigService } from './pgp-config.service';
import { S3ConfigService } from './s3-config.service';
import { Web3ConfigService } from './web3-config.service';

@Global()
@Module({
  providers: [
    ConfigService,
    ServerConfigService,
    Web3ConfigService,
    S3ConfigService,
    PGPConfigService,
  ],
  exports: [
    ConfigService,
    ServerConfigService,
    Web3ConfigService,
    S3ConfigService,
    PGPConfigService,
  ],
})
export class EnvConfigModule {}
