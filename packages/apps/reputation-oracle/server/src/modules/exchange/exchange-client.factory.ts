import { Injectable } from '@nestjs/common';

import type { SupportedExchange } from '@/common/constants';

import { GateExchangeClient } from './gate-exchange.client';
import { MexcExchangeClient } from './mexc-exchange.client';
import type {
  ExchangeClient,
  ExchangeClientCredentials,
  ExchangeClientOptions,
} from './types';

@Injectable()
export class ExchangeClientFactory {
  async create(
    exchange: SupportedExchange,
    creds: ExchangeClientCredentials,
    options?: ExchangeClientOptions,
  ): Promise<ExchangeClient> {
    switch (exchange) {
      case 'mexc': {
        return new MexcExchangeClient(creds, options);
      }
      case 'gate': {
        return new GateExchangeClient(creds, options);
      }
      default:
        throw new Error(`Unsupported exchange: ${exchange}`);
    }
  }
}
