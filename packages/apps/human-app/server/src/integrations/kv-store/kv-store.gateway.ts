import { HttpException, Inject, Injectable } from '@nestjs/common';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { ethers } from 'ethers';
import { KVStoreClient, KVStoreKeys } from '@human-protocol/sdk';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { KV_STORE_CACHE_KEY } from '../../common/constants/cache';

@Injectable()
export class KvStoreGateway {
  private kvStoreClient: KVStoreClient;
  constructor(
    private configService: EnvironmentConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  async onModuleInit(): Promise<void> {
    this.kvStoreClient = await KVStoreClient.build(
      new ethers.JsonRpcProvider(this.configService.rpcUrl),
    );
  }
  async getExchangeOracleUrlByAddress(address: string): Promise<string | void> {
    const key = `${KV_STORE_CACHE_KEY}:${address}`;
    const cachedUrl: string | undefined = await this.cacheManager.get(key);
    if (cachedUrl) {
      return cachedUrl;
    }
    let fetchedUrl: string;
    try {
      fetchedUrl = await this.kvStoreClient.get(address, KVStoreKeys.url);
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
    if (!fetchedUrl || fetchedUrl === '') {
      throw new HttpException(
        `Unable to retrieve URL from address: ${address}`,
        400,
      );
    } else {
      await this.cacheManager.set(key, fetchedUrl, {
        ttl: this.configService.cacheTtlExchangeOracleUrl,
      } as any);
      return fetchedUrl;
    }
  }
}
