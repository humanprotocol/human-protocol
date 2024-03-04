import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  OracleDiscoveryCommand,
  OracleDiscoveryData,
} from './interface/oracle-discovery.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { OperatorUtils } from '@human-protocol/sdk';
@Injectable()
export class OracleDiscoveryService {
  static readonly TTL_1_DAY = 24 * 60 * 60;
  logger = new Logger(OracleDiscoveryService.name);
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async processOracleDiscovery(
    command: OracleDiscoveryCommand,
  ): Promise<OracleDiscoveryData[]> {
    let data: OracleDiscoveryData[] | undefined = await this.cacheManager.get(
      command.address,
    );
    if (!data) {
      data = await this.getOperatorsForOracleDiscovery(command);
      await this.setOperatorsForAddress(command.address, data);
    }
    this.logger.log(`Returning data: ${JSON.stringify(data)}`);
    return data;
  }
  getOperatorsForOracleDiscovery = (
    cmd: OracleDiscoveryCommand,
  ): Promise<OracleDiscoveryData[]> => {
    return OperatorUtils.getReputationNetworkOperators(
      cmd.chainId,
      cmd.address,
      cmd.role,
    );
  };
  setOperatorsForAddress = (
    address: string,
    operators: OracleDiscoveryData[],
  ): Promise<void> => {
    return this.cacheManager.set(
      address,
      operators,
      OracleDiscoveryService.TTL_1_DAY,
    );
  };
}
