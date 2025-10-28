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
  private readonly timeoutMs?: number;
  private readonly logger = appLogger.child({
    context: 'MexcExchangeClient',
    exchange: 'mexc',
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
    const timestamp = Date.now();
    const query = `timestamp=${timestamp}&recvWindow=${this.recvWindow}`;
    const signature = this.signQuery(query);
    const url = `${MEXC_API_BASE_URL}${path}?${query}&signature=${signature}`;

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'X-MEXC-APIKEY': this.apiKey },
        signal: AbortSignal.timeout(this.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      } as RequestInit);

      if (res.ok) return true;
      this.logger.warn('MEXC access check failed', {
        status: res.status,
        statusText: res.statusText,
      });
      return false;
    } catch (err) {
      const message: string = 'MEXC network error during access check';
      this.logger.error(message, {
        error: err.message,
      });
      throw new ExchangeApiClientError(`${message}: ${err.message}`);
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
        signal: AbortSignal.timeout(this.timeoutMs ?? DEFAULT_TIMEOUT_MS),
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
    } catch (err) {
      const message: string = 'MEXC network error during balance fetch';
      this.logger.error(message, {
        error: err.message,
        asset,
      });
      throw new ExchangeApiClientError(`${message}: ${err.message}`);
    }
  }
}
