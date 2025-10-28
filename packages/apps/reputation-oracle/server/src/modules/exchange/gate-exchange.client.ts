import { createHash, createHmac } from 'node:crypto';

import { DEFAULT_TIMEOUT_MS, type SupportedExchange } from '@/common/constants';
import appLogger from '@/logger';
import Environment from '@/utils/environment';

import { ExchangeApiClientError } from './errors';
import type {
  ExchangeClient,
  ExchangeClientCredentials,
  ExchangeClientOptions,
} from './types';

const GATE_API_BASE_URL = 'https://api.gateio.ws/api/v4';
const DEVELOP_GATE_API_BASE_URL = 'https://api-testnet.gateapi.io/api/v4';

function signGateRequest(
  method: string,
  path: string,
  query: string,
  body: string,
  secret: string,
  ts: string,
): string {
  const bodyHash = createHash('sha512')
    .update(body ?? '')
    .digest('hex');
  const payload = [method, path, query, bodyHash, ts].join('\n');
  return createHmac('sha512', secret).update(payload).digest('hex');
}

export class GateExchangeClient implements ExchangeClient {
  readonly id: SupportedExchange = 'gate';
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly timeoutMs?: number;
  private readonly apiBaseUrl = Environment.isDevelopment()
    ? DEVELOP_GATE_API_BASE_URL
    : GATE_API_BASE_URL;
  private readonly logger = appLogger.child({
    context: 'GateExchangeClient',
    exchange: 'gate',
  });

  constructor(
    creds: ExchangeClientCredentials,
    options?: ExchangeClientOptions,
  ) {
    if (!creds?.apiKey || !creds?.secretKey) {
      throw new ExchangeApiClientError('Incomplete credentials for Gate');
    }
    this.apiKey = creds.apiKey;
    this.secretKey = creds.secretKey;
    this.timeoutMs = options?.timeoutMs;
  }

  async checkRequiredAccess(): Promise<boolean> {
    const method = 'GET';
    const path = '/spot/accounts';
    const query = '';
    const body = '';
    const ts = String(Math.floor(Date.now() / 1000));
    const signature = signGateRequest(
      method,
      `/api/v4${path}`,
      query,
      body,
      this.secretKey,
      ts,
    );

    try {
      const res = await fetch(`${this.apiBaseUrl}${path}`, {
        method,
        headers: {
          KEY: this.apiKey,
          SIGN: signature,
          Timestamp: ts,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(this.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      } as RequestInit);

      if (res.ok) return true;
      if (res.status === 401 || res.status === 403) return false;
      this.logger.warn('Gate access check failed', {
        status: res.status,
        statusText: res.statusText,
      });
      throw new ExchangeApiClientError(
        `Gate access check failed with status ${res.status}`,
      );
    } catch (err) {
      const message: string = 'Gate network error during access check';
      this.logger.error(message, {
        error: err.message,
      });
      throw new ExchangeApiClientError(`${message}: ${(err as Error).message}`);
    }
  }

  async getAccountBalance(asset: string): Promise<number> {
    const method = 'GET';
    const path = '/spot/accounts';
    const query = `currency=${encodeURIComponent(asset)}`;
    const body = '';
    const ts = String(Math.floor(Date.now() / 1000));
    const requestPath = `/api/v4${path}`;
    const signature = signGateRequest(
      method,
      requestPath,
      query,
      body,
      this.secretKey,
      ts,
    );
    const url = `${this.apiBaseUrl}${path}?${query}`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          KEY: this.apiKey,
          SIGN: signature,
          Timestamp: ts,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(this.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      } as RequestInit);

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) return 0;
        this.logger.warn('Gate balance fetch failed', {
          status: res.status,
          statusText: res.statusText,
          asset,
        });
        throw new ExchangeApiClientError(
          `Gate balance fetch failed with status ${res.status}`,
        );
      }

      const data = (await res.json()) as Array<{
        currency: string;
        available: string;
        locked?: string;
        freeze?: string;
      }>;

      const normalize = (item: {
        currency: string;
        available: string;
        locked?: string;
        freeze?: string;
      }) => {
        const free = parseFloat(item.available) || 0;
        const locked = parseFloat(item.locked ?? item.freeze ?? '0') || 0;
        return free + locked;
      };

      const entry = data.find((d) => d.currency === asset);
      return entry ? normalize(entry) : 0;
    } catch (err) {
      const message: string = 'Gate network error during balance fetch';
      this.logger.error(message, {
        error: (err as Error)?.message,
        asset,
      });
      throw new ExchangeApiClientError(`${message}: ${err.message}`);
    }
  }
}
