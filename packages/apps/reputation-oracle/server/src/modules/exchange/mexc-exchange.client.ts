import { createHmac } from 'node:crypto';

import { DEFAULT_TIMEOUT_MS, type SupportedExchange } from '@/common/constants';
import appLogger from '@/logger';

import { ExchangeApiClientError } from './errors';
import type {
  ExchangeClient,
  ExchangeClientCredentials,
  ExchangeClientOptions,
} from './types';

const MEXC_API_BASE_URL = 'https://api.mexc.com/api/v3';

export class MexcExchangeClient implements ExchangeClient {
  readonly id: SupportedExchange = 'mexc';
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly timeoutMs: number;
  private readonly logger = appLogger.child({
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
    this.timeoutMs = options?.timeoutMs || DEFAULT_TIMEOUT_MS;
  }

  private signQuery(query: string): string {
    return createHmac('sha256', this.secretKey).update(query).digest('hex');
  }

  async checkRequiredAccess(): Promise<boolean> {
    const path = '/account';
    const timestamp = Date.now();
    const query = `timestamp=${timestamp}&recvWindow=${this.recvWindow}`;
    const signature = this.signQuery(query);
    const url = `${MEXC_API_BASE_URL}${path}?${query}&signature=${signature}`;

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'X-MEXC-APIKEY': this.apiKey },
        signal: AbortSignal.timeout(this.timeoutMs),
      } as RequestInit);

      if (res.ok) return true;
      this.logger.debug('MEXC access check failed', {
        status: res.status,
        statusText: res.statusText,
      });
      return false;
    } catch (error) {
      const message: string = 'Failed to check access for MEXC';
      this.logger.error(message, {
        error,
      });
      throw new ExchangeApiClientError(message);
    }
  }

  async getAccountBalance(asset: string): Promise<number> {
    const path = '/account';
    const timestamp = Date.now();
    const query = `timestamp=${timestamp}&recvWindow=${this.recvWindow}`;
    const signature = this.signQuery(query);
    const url = `${MEXC_API_BASE_URL}${path}?${query}&signature=${signature}`;

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'X-MEXC-APIKEY': this.apiKey,
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      } as RequestInit);

      if (!res.ok) {
        this.logger.warn('MEXC balance fetch failed', {
          status: res.status,
          statusText: res.statusText,
          asset,
        });
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
    } catch (error) {
      const message: string = 'Failed to get account balance for MEXC';
      this.logger.error(message, {
        error,
        asset,
      });
      throw new ExchangeApiClientError(message);
    }
  }
}
