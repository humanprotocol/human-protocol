import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExchangeOracleGateway } from './exchange-oracle.gateway';
import { ExchangeOracleProfile } from './exchange-oracle.mapper';

@Module({
  imports: [HttpModule],
  providers: [ExchangeOracleGateway, ExchangeOracleProfile],
  exports: [ExchangeOracleGateway],
})
export class ExchangeOracleModule {}
