import { Module, forwardRef } from '@nestjs/common';

import { EncryptionModule } from '@/modules/encryption';
import { ExchangeModule } from '@/modules/exchange/exchange.module';

import { ExchangeApiKeysController } from './exchange-api-keys.controller';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';
import { ExchangeApiKeysService } from './exchange-api-keys.service';
import { UserModule } from '../user';

@Module({
  imports: [forwardRef(() => ExchangeModule), EncryptionModule, UserModule],
  providers: [ExchangeApiKeysRepository, ExchangeApiKeysService],
  controllers: [ExchangeApiKeysController],
  exports: [ExchangeApiKeysRepository, ExchangeApiKeysService],
})
export class ExchangeApiKeysModule {}
