import { createHash, createHmac } from 'node:crypto';

import { SupportedExchange } from '@/common/constants';
import logger from '@/logger';
import Environment from '@/utils/environment';

import {
  ExchangeApiClientError,
  ExchangeProviderResponseError,
} from './errors';
import type {
  ExchangeClient,
  ExchangeClientCredentials,
  ExchangeClientOptions,
} from './types';
import { fetchWithHandling } from './utils';

export const GATE_API_BASE_URL = 'https://api.gateio.ws/api/v4';
export const DEVELOP_GATE_API_BASE_URL =
  'https://api-testnet.gateapi.io/api/v4';

export class GateExchangeClient implements ExchangeClient {
  readonly id = SupportedExchange.GATE;
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
    const { signature, timestamp } = this.signGateRequest(
      method,
      `/api/v4${path}`,
      query,
      body,
    );

    const res = await fetchWithHandling(
      `${this.apiBaseUrl}${path}`,
      {
        KEY: this.apiKey,
        SIGN: signature,
        Timestamp: timestamp,
        Accept: 'application/json',
      },
      this.logger,
      this.timeoutMs,
    );

    if (res.ok) return true;
    return false;
  }

  async getAccountBalance(asset: string): Promise<number> {
    const method = 'GET';
    const path = '/spot/accounts';
    const query = `currency=${encodeURIComponent(asset)}`;
    const body = '';
    const requestPath = `/api/v4${path}`;
    const { signature, timestamp } = this.signGateRequest(
      method,
      requestPath,
      query,
      body,
    );
    const url = `${this.apiBaseUrl}${path}?${query}`;

    const res = await fetchWithHandling(
      url,
      {
        KEY: this.apiKey,
        SIGN: signature,
        Timestamp: timestamp,
        Accept: 'application/json',
      },
      this.logger,
      this.timeoutMs,
    );

    if (!res.ok) {
      const errorBody = await res.json();
      throw new ExchangeProviderResponseError(
        this.id,
        res.status,
        errorBody.message as string,
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
  }

  private signGateRequest(
    method: string,
    path: string,
    query: string,
    body: string,
  ): { signature: string; timestamp: string } {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const bodyHash = createHash('sha512')
      .update(body ?? '')
      .digest('hex');
    const payload = [method, path, query, bodyHash, timestamp].join('\n');
    const signature = createHmac('sha512', this.secretKey)
      .update(payload)
      .digest('hex');
    return { signature, timestamp };
  }
}
