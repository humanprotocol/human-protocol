import { Module, forwardRef } from '@nestjs/common';

import { ExchangeApiKeysModule } from '@/modules/exchange-api-keys';

import { ExchangeRouterService } from './exchange.router.service';
import { GateExchangeService } from './gate-exchange.service';
import { MexcExchangeService } from './mexc-exchange.service';

@Module({
  imports: [forwardRef(() => ExchangeApiKeysModule)],
  providers: [MexcExchangeService, GateExchangeService, ExchangeRouterService],
  exports: [ExchangeRouterService],
})
export class ExchangeModule {}
