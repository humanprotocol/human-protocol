import { HttpException, Inject, Injectable } from '@nestjs/common';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { ethers } from 'ethers';
import { KVStoreClient, KVStoreKeys } from '@human-protocol/sdk';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  KV_STORE_REGISTRATION_NEEDED_CACHE_KEY,
  KV_STORE_URL_CACHE_KEY,
} from '../../common/constants/cache';

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
  async getExchangeOracleRegistrationNeeded(
    address: string,
  ): Promise<boolean | void> {
    const key = `${KV_STORE_REGISTRATION_NEEDED_CACHE_KEY}:${address}`;
    const cachedData: string | undefined = await this.cacheManager.get(key);
    if (cachedData) {
      return cachedData.toLowerCase() === 'true';
    }
    let fetchedData: string;
    try {
      fetchedData = await this.kvStoreClient.get(
        address,
        KVStoreKeys.registrationNeeded,
      );
    } catch (e) {
      if (e.toString().includes('Error: Invalid address')) {
        throw new HttpException(
          `Unable to retrieve registration needed flag from address: ${address}`,
          400,
        );
      } else {
        throw new Error(
          `Error, while fetching exchange oracle registration needed flag from kv-store: ${e}`,
        );
      }
    }
    fetchedData = 'true'
    if (!fetchedData || fetchedData === '') {
      throw new HttpException(
        `Unable to retrieve registration needed flag from address: ${address}`,
        400,
      );
    } else {
      await this.cacheManager.set(key, fetchedData, {
        ttl: this.configService.cacheTtlExchangeOracleRegistrationNeeded,
      } as any);
      return fetchedData.toLowerCase() === 'true';
    }
  }
  async getExchangeOracleUrlByAddress(address: string): Promise<string | void> {
    const key = `${KV_STORE_URL_CACHE_KEY}:${address}`;
    const cachedData: string | undefined = await this.cacheManager.get(key);
    if (cachedData) {
      return cachedData;
    }
    let fetchedData: string;
    try {
      fetchedData = await this.kvStoreClient.get(address, KVStoreKeys.url);
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
