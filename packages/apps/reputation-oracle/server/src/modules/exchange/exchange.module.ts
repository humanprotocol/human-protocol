import { Module } from '@nestjs/common';

import { ExchangeClientFactory } from './exchange-client.factory';

@Module({
  providers: [ExchangeClientFactory],
  exports: [ExchangeClientFactory],
})
export class ExchangeModule {}
