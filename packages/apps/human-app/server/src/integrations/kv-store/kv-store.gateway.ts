import { HttpException, Inject, Injectable } from '@nestjs/common';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { ethers, JsonRpcProvider } from 'ethers';
import { KVStoreKeys, KVStoreUtils, NETWORKS } from '@human-protocol/sdk';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { KVStore__factory } from '@human-protocol/core/typechain-types';

@Injectable()
export class KvStoreGateway {
  get cachePrefix() {
    return 'KV_STORE:';
  }
  private signer: JsonRpcProvider;
  constructor(
    private configService: EnvironmentConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  async onModuleInit(): Promise<void> {
    this.signer = new ethers.JsonRpcProvider(this.configService.rpcUrl);
  }
  async getExchangeOracleUrlByAddress(address: string): Promise<string | void> {
    const cachedUrl: string | undefined = await this.cacheManager.get(
      this.cachePrefix + address,
    );
    if (cachedUrl) {
      return cachedUrl;
    }
    let fetchedUrl: string;
    try {
      const signer = new ethers.JsonRpcProvider(this.configService.rpcUrl);
      const kvstoreContract = KVStore__factory.connect(NETWORKS[chainId]!.kvstoreAddress!, this.signer);
      fetchedUrl = await KVStoreUtils.get(kvstoreContract, address, KVStoreKeys.url);
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
      await this.cacheManager.set(this.cachePrefix + address, fetchedUrl, {
        ttl: this.configService.cacheTtlExchangeOracleUrl,
      } as any);
      return fetchedUrl;
    }
  }
}
