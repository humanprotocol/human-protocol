import type { SupportedExchange } from '@/common/constants';

export interface ExchangeClientCredentials {
  apiKey: string;
  secretKey: string;
}

export interface ExchangeClientOptions {
  timeoutMs?: number;
}

export interface ExchangeClient {
  readonly id: SupportedExchange;
  checkRequiredAccess(): Promise<boolean>;
  getAccountBalance(asset: string): Promise<number>;
}
