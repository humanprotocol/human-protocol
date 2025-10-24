import { createHmac } from 'node:crypto';

import { Inject, Injectable, forwardRef } from '@nestjs/common';

import { StakingConfigService } from '@/config';
import logger from '@/logger';
import { ExchangeApiKeysService } from '@/modules/exchange-api-keys';

import { ExchangeCredentials, ExchangeService } from './exchange.service';

const MEXC_API_BASE_URL = 'https://api.mexc.com/api/v3';

@Injectable()
export class MexcExchangeService extends ExchangeService {
  readonly id = 'mexc' as const;
  readonly recvWindow = 5000;
  private readonly logger = logger.child({ context: MexcExchangeService.name });

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
    const path = '/account';
    const timestamp = Date.now();
    const query = `timestamp=${timestamp}&recvWindow=${this.recvWindow}`;
    const signature = createHmac('sha256', creds.secret)
      .update(query)
      .digest('hex');
    const url = `${MEXC_API_BASE_URL}${path}?${query}&signature=${signature}`;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.stakingConfigService.timeoutMs,
    );
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'X-MEXC-APIKEY': creds.apiKey },
        signal: controller.signal,
      } as RequestInit);
      return res.ok;
    } catch (error) {
      this.logger.error('MEXC access check failed', {
        error,
      });
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getAccountBalance(userId: number, asset = 'HMT'): Promise<number> {
    const creds = await this.exchangeApiKeysService.retrieve(userId, this.id);

    const path = '/account';
    const timestamp = Date.now();
    const query = `timestamp=${timestamp}&recvWindow=${this.recvWindow}`;
    const signature = createHmac('sha256', creds.secretKey)
      .update(query)
      .digest('hex');
    const url = `${MEXC_API_BASE_URL}${path}?${query}&signature=${signature}`;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.stakingConfigService.timeoutMs,
    );
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'X-MEXC-APIKEY': creds.apiKey,
        },
        signal: controller.signal,
      } as RequestInit);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Http error ${res.status}: ${text}`);
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
      this.logger.error('MEXC getAccountBalance failed', {
        error,
      });
      return 0;
    } finally {
      clearTimeout(timeout);
    }
  }
}
