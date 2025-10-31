import { createHmac } from 'node:crypto';

import { type SupportedExchange } from '@/common/constants';
import logger from '@/logger';

import { ExchangeApiClientError } from './errors';
import type {
  ExchangeClient,
  ExchangeClientCredentials,
  ExchangeClientOptions,
} from './types';
import { fetchWithHandling } from './utils';

export const MEXC_API_BASE_URL = 'https://api.mexc.com/api/v3';

export class MexcExchangeClient implements ExchangeClient {
  readonly id: SupportedExchange = 'mexc';
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly timeoutMs?: number;
  private readonly logger = logger.child({
    context: MexcExchangeClient.name,
    exchange: this.id,
  });
  readonly recvWindow = 5000;

  constructor(
    creds: ExchangeClientCredentials,
    options?: ExchangeClientOptions,
  ) {
    if (!creds?.apiKey || !creds?.secretKey) {
      throw new ExchangeApiClientError('Incomplete credentials for MEXC');
    }
    this.apiKey = creds.apiKey;
    this.secretKey = creds.secretKey;
    this.timeoutMs = options?.timeoutMs;
  }

  private signQuery(query: string): string {
    return createHmac('sha256', this.secretKey).update(query).digest('hex');
  }

  async checkRequiredAccess(): Promise<boolean> {
    const path = '/account';
    const { query, signature } = this.getSignedQuery();
    const url = `${MEXC_API_BASE_URL}${path}?${query}&signature=${signature}`;

    const res = await fetchWithHandling(
      url,
      { 'X-MEXC-APIKEY': this.apiKey },
      this.logger,
      this.timeoutMs,
    );
    if (res.ok) return true;
    return false;
  }

  async getAccountBalance(asset: string): Promise<number> {
    const path = '/account';
    const { query, signature } = this.getSignedQuery();
    const url = `${MEXC_API_BASE_URL}${path}?${query}&signature=${signature}`;

    const res = await fetchWithHandling(
      url,
      { 'X-MEXC-APIKEY': this.apiKey },
      this.logger,
      this.timeoutMs,
    );
    if (!res.ok) {
      return 0;
    }
    const data = (await res.json()) as {
      balances?: Array<{ asset: string; free: string; locked: string }>;
    };
    const balances = data.balances || [];
    const entry = balances.find((b) => b.asset === asset);
    if (!entry) return 0;
    const total =
      (parseFloat(entry.free || '0') || 0) +
      (parseFloat(entry.locked || '0') || 0);
    return total;
  }

  private getSignedQuery(): {
    query: string;
    signature: string;
  } {
    const timestamp = Date.now();
    const query = `timestamp=${timestamp}&recvWindow=${this.recvWindow}`;
    const signature = this.signQuery(query);
    return { query, signature };
  }
}
