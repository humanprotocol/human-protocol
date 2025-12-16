import { Module } from '@nestjs/common';

import { ExchangeModule } from '@/modules/exchange/exchange.module';
import { ExchangeApiKeysModule } from '@/modules/exchange-api-keys';
import { UserModule } from '@/modules/user';
import { Web3Module } from '@/modules/web3';

import { StakingController } from './staking.controller';
import { StakingService } from './staking.service';

@Module({
  imports: [ExchangeApiKeysModule, ExchangeModule, UserModule, Web3Module],
  providers: [StakingService],
  controllers: [StakingController],
  exports: [StakingService],
})
export class StakingModule {}
