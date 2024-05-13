import { Injectable } from '@nestjs/common';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { ethers } from 'ethers';
import { KVStoreClient, KVStoreKeys } from '@human-protocol/sdk';

@Injectable()
export class KvStoreGateway {
  private kvStoreClient: KVStoreClient;
  constructor(private environmentConfig: EnvironmentConfigService) {}
  async onModuleInit(): Promise<void> {
    this.kvStoreClient = await KVStoreClient.build(
      new ethers.JsonRpcProvider(this.environmentConfig.rpcUrl),
    );
  }
  async getExchangeOracleUrlByAddress(address: string): Promise<string> {
    return this.kvStoreClient.get(address, KVStoreKeys.url);
  }
}
