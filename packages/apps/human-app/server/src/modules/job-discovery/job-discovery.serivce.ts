import { Inject, Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import {
  OracleDiscoveryCommand,
  OracleDiscoveryData,
} from './interface/oracle-discovery.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IOperator, OperatorUtils } from '@human-protocol/sdk';

@Injectable()
export class JobDiscoveryService {
  static readonly TTL_1_DAY = 24 * 60 * 60;
  constructor(
    private reputationOracleGateway: ReputationOracleGateway,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async processOracleDiscovery(
    command: OracleDiscoveryCommand,
  ): Promise<OracleDiscoveryData[]> {
    const cachedData: OracleDiscoveryData[] | undefined =
      await this.cacheManager.get(command.address);
    if (cachedData) {
      return cachedData;
    }
    const data: IOperator[] =
      await this.getOperatorsForOracleDiscovery(command);
    await this.setOperatorsForAddress(command.address, data);
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
      JobDiscoveryService.TTL_1_DAY,
    );
  };
}
