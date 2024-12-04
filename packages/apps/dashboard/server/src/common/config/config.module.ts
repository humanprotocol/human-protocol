import { Module, Global } from '@nestjs/common';
import { EnvironmentConfigService } from './env-config.service';
import { RedisConfigService } from './redis-config.service';
import { NetworkConfigService } from './network-config.service';
import { S3ConfigService } from './s3-config.service';

@Global()
@Module({
  providers: [
    RedisConfigService,
    EnvironmentConfigService,
    NetworkConfigService,
    S3ConfigService,
  ],
  exports: [
    RedisConfigService,
    EnvironmentConfigService,
    NetworkConfigService,
    S3ConfigService,
  ],
})
export class CommonConfigModule {}
