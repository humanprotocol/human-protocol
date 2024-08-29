import { HttpException, Inject, Injectable } from '@nestjs/common';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { ethers } from 'ethers';
import { ChainId, KVStoreKeys, KVStoreUtils } from '@human-protocol/sdk';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ORACLE_URL_CACHE_KEY } from '../../common/constants/cache';

@Injectable()
export class KvStoreGateway {
  constructor(
    private configService: EnvironmentConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  async getExchangeOracleUrlByAddress(address: string): Promise<string | void> {
    const key = `${ORACLE_URL_CACHE_KEY}:${address}`;
    const cachedData: string | undefined = await this.cacheManager.get(key);
    if (cachedData) {
      return cachedData;
    }
    let fetchedData: string;
    try {
      const runner = new ethers.JsonRpcProvider(this.configService.rpcUrl);
      const network = await runner.provider?.getNetwork();
      const chainId: ChainId = Number(network?.chainId);

      fetchedData = await KVStoreUtils.get(chainId, address, KVStoreKeys.url);
    } catch (e) {
      if (e.toString().includes('Error: Invalid address')) {
        throw new HttpException(
          `Unable to retrieve URL from address: ${address}`,
          400,
        );
      } else {
        throw new Error(
          `Error, while fetching exchange oracle URL from kv-store: ${e}`,
        );
      }
    }
    if (!fetchedData || fetchedData === '') {
      throw new HttpException(
        `Unable to retrieve URL from address: ${address}`,
        400,
      );
    } else {
      await this.cacheManager.set(key, fetchedData, {
        ttl: this.configService.cacheTtlExchangeOracleUrl,
      } as any);
      return fetchedData;
    }
  }
}
