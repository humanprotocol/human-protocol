import { createHash, createHmac } from 'node:crypto';

import { Inject, Injectable, forwardRef } from '@nestjs/common';

import { StakingConfigService } from '@/config';
import logger from '@/logger';
import { ExchangeApiKeysService } from '@/modules/exchange-api-keys';
import Environment from '@/utils/environment';

import { ExchangeCredentials, ExchangeService } from './exchange.service';

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

@Injectable()
export class GateExchangeService extends ExchangeService {
  readonly id = 'gate' as const;
  private readonly logger = logger.child({ context: GateExchangeService.name });
  private readonly apiBaseUrl =
    process.env.GATE_API_BASE_URL && process.env.GATE_API_BASE_URL.length > 0
      ? process.env.GATE_API_BASE_URL
      : Environment.isDevelopment()
        ? DEVELOP_GATE_API_BASE_URL
        : GATE_API_BASE_URL;

  constructor(
    @Inject(forwardRef(() => ExchangeApiKeysService))
    private readonly exchangeApiKeysService: ExchangeApiKeysService,
    private readonly stakingConfigService: StakingConfigService,
  ) {
    super();
  }

  checkRequiredCredentials(creds: ExchangeCredentials): boolean {
    return Boolean(creds?.apiKey && creds?.secret);
  }

  async checkRequiredAccess(creds: ExchangeCredentials): Promise<boolean> {
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
      creds.secret,
      ts,
    );

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.stakingConfigService.timeoutMs,
    );
    try {
      const res = await fetch(`${this.apiBaseUrl}${path}`, {
        method,
        headers: {
          KEY: creds.apiKey,
          SIGN: signature,
          Timestamp: ts,
          Accept: 'application/json',
        },
        signal: controller.signal,
      } as RequestInit);
      if (!res.ok) {
        const text = await res.text();
        console.warn('Gate access check http error', {
          status: res.status,
          body: text,
        });
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error('Gate access check failed', {
        error,
      });
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getAccountBalance(userId: number, asset = 'HMT'): Promise<number> {
    const creds = await this.exchangeApiKeysService.retrieve(userId, this.id);

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
      creds.secretKey,
      ts,
    );
    const url = `${this.apiBaseUrl}${path}?${query}`;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.stakingConfigService.timeoutMs,
    );
    try {
      const res = await fetch(url, {
        method,
        headers: {
          KEY: creds.apiKey,
          SIGN: signature,
          Timestamp: ts,
          Accept: 'application/json',
        },
        signal: controller.signal,
      } as RequestInit);
      if (!res.ok) {
        const text = await res.text();
        this.logger.error('Gate getAccountBalance http error', {
          status: res.status,
          body: text,
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
    } catch (error) {
      this.logger.error('Gate getAccountBalance failed', {
        error,
      });
      return 0;
    } finally {
      clearTimeout(timeout);
    }
  }
}
