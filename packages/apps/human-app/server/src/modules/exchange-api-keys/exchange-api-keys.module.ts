import { Module } from '@nestjs/common';
import { ExchangeApiKeysController } from '../../modules/exchange-api-keys/exchange-api-keys.controller';
import { ExchangeApiKeysService } from '../../modules/exchange-api-keys/exchange-api-keys.service';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { ExchangeApiKeysProfile } from './exchange-api-keys.mapper.profile';

@Module({
  imports: [ReputationOracleModule],
  controllers: [ExchangeApiKeysController],
  providers: [ExchangeApiKeysService, ExchangeApiKeysProfile],
  exports: [ExchangeApiKeysService],
})
export class ExchangeApiKeysModule {}
