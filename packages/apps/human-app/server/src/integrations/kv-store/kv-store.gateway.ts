import {
  ChainId,
  KVStoreKeys,
  KVStoreUtils,
  StorageClient,
} from '@human-protocol/sdk';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ethers } from 'ethers';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { JWT_KVSTORE_KEY } from '../../common/constants';
import {
  ORACLE_URL_CACHE_KEY,
  REPUTATION_ORACLE_PUBLIC_KEY,
} from '../../common/constants/cache';

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
    let oracleUrl: string;
    try {
      const runner = new ethers.JsonRpcProvider(this.configService.rpcUrl);
      const network = await runner.provider?.getNetwork();
      const chainId: ChainId = Number(network?.chainId);

      oracleUrl = await KVStoreUtils.get(chainId, address, KVStoreKeys.url);
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

    if (!oracleUrl || oracleUrl === '') {
      throw new HttpException(
        `Unable to retrieve URL from address: ${address}`,
        400,
      );
    }

    oracleUrl = oracleUrl.replace(/\/$/, '');

    await this.cacheManager.set(
      key,
      oracleUrl,
      this.configService.cacheTtlExchangeOracleUrl,
    );

    return oracleUrl;
  }

  async getJobTypesByAddress(
    chainId: ChainId,
    address: string,
  ): Promise<string | void> {
    const key = `jobTypes:${address}`;
    const cachedData: string | undefined = await this.cacheManager.get(key);
    if (cachedData) {
      return cachedData;
    }

    let jobTypes: string;
    try {
      jobTypes = await KVStoreUtils.get(chainId, address, KVStoreKeys.jobTypes);
    } catch (e) {
      if (e.toString().includes('Error: Invalid address')) {
        throw new HttpException(
          `Unable to retrieve job types from address: ${address}`,
          400,
        );
      } else {
        throw new Error(`Error while fetching job types from kv-store: ${e}`);
      }
    }

    if (!jobTypes || jobTypes === '') {
      return;
    } else {
      await this.cacheManager.set(
        key,
        jobTypes,
        this.configService.cacheTtlJobTypes,
      );

      return jobTypes;
    }
  }

  async getReputationOraclePublicKey(
    chainId: ChainId,
    address: string,
  ): Promise<string> {
    const key = `${REPUTATION_ORACLE_PUBLIC_KEY}:${chainId}:${address}`;
    const cachedData: string | undefined = await this.cacheManager.get(key);
    if (cachedData) {
      return cachedData;
    }

    let publicKey: string;
    try {
      const url = await KVStoreUtils.getFileUrlAndVerifyHash(
        chainId,
        address,
        JWT_KVSTORE_KEY,
      );
      publicKey = (await StorageClient.downloadFileFromUrl(url)) as string;
    } catch (e) {
      if (e.toString().includes('Error: Invalid address')) {
        throw new HttpException(
          `Unable to retrieve public key from address: ${address}`,
          400,
        );
      } else {
        throw new Error(`Error while fetching public key from kv-store: ${e}`);
      }
    }

    if (!publicKey || publicKey === '') {
      throw new HttpException(
        `Unable to retrieve public key from address: ${address}`,
        400,
      );
    } else {
      // Guardar en caché sin TTL (persistente)
      await this.cacheManager.set(key, publicKey, 0);
      return publicKey;
    }
  }
}
