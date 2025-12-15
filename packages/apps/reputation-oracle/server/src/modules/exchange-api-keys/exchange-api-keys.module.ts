import { Module } from '@nestjs/common';

import { EncryptionModule } from '@/modules/encryption';
import { ExchangeModule } from '@/modules/exchange/exchange.module';
import { Web3Module } from '@/modules/web3';

import { ExchangeApiKeysController } from './exchange-api-keys.controller';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';
import { ExchangeApiKeysService } from './exchange-api-keys.service';
import { UserModule } from '../user';

@Module({
  imports: [ExchangeModule, EncryptionModule, UserModule, Web3Module],
  providers: [ExchangeApiKeysRepository, ExchangeApiKeysService],
  controllers: [ExchangeApiKeysController],
  exports: [ExchangeApiKeysRepository, ExchangeApiKeysService],
})
export class ExchangeApiKeysModule {}
