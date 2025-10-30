import { createHash, createHmac } from 'node:crypto';

import { type SupportedExchange } from '@/common/constants';
import logger from '@/logger';
import Environment from '@/utils/environment';

import { ExchangeApiClientError } from './errors';
import type {
  ExchangeClient,
  ExchangeClientCredentials,
  ExchangeClientOptions,
} from './types';
import { fetchWithHandling } from './utils';

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
  private readonly logger = logger.child({
    context: GateExchangeClient.name,
    exchange: this.id,
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

    const res = await fetchWithHandling(
      this.id,
      `${this.apiBaseUrl}${path}`,
      {
        KEY: this.apiKey,
        SIGN: signature,
        Timestamp: ts,
        Accept: 'application/json',
      },
      this.logger,
      this.timeoutMs,
    );

    if (res.ok) return true;
    this.logger.debug('Gate access check failed', {
      status: res.status,
      statusText: res.statusText,
    });
    return false;
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

    const res = await fetchWithHandling(
      this.id,
      url,
      {
        KEY: this.apiKey,
        SIGN: signature,
        Timestamp: ts,
        Accept: 'application/json',
      },
      this.logger,
      this.timeoutMs,
    );

    if (!res.ok) {
      this.logger.warn('Gate balance fetch failed', {
        status: res.status,
        statusText: res.statusText,
        asset,
      });
      return 0;
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
  }
}
