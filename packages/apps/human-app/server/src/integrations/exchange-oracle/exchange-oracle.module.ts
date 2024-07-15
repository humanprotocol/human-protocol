import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExchangeOracleGateway } from './exchange-oracle.gateway';
import { ExchangeOracleProfile } from './exchange-oracle.mapper.profile';
import { EscrowUtilsModule } from '../escrow/escrow-utils.module';
import { KvStoreModule } from '../kv-store/kv-store.module';

@Module({
  imports: [HttpModule, EscrowUtilsModule, KvStoreModule],
  providers: [ExchangeOracleGateway, ExchangeOracleProfile],
  exports: [ExchangeOracleGateway],
})
export class ExchangeOracleModule {}
