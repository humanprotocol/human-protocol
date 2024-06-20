import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { ethers } from 'ethers';
import { KVStoreClient, KVStoreKeys } from '@human-protocol/sdk';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

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
  async getExchangeOracleUrlByAddress(address: string): Promise<string> {
    const cachedUrl: string | undefined = await this.cacheManager.get(address);
    if (cachedUrl) {
      return cachedUrl;
    }
    const fetchedUrl = await this.kvStoreClient.get(address, KVStoreKeys.url);
    await this.cacheManager.set(
      address,
      fetchedUrl,
      this.configService.cacheTtlExchangeOracleUrl,
    );
    return fetchedUrl;
  }
}
