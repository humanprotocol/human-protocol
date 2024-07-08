import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  OracleDiscoveryCommand,
  OracleDiscoveryResponse,
} from './model/oracle-discovery.model';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { OperatorUtils } from '@human-protocol/sdk';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';

@Injectable()
export class OracleDiscoveryService {
  logger = new Logger('OracleDiscoveryService');
  EXCHANGE_ORACLE = 'Exchange Oracle';
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: EnvironmentConfigService,
  ) {}

  async processOracleDiscovery(
    command: OracleDiscoveryCommand,
  ): Promise<OracleDiscoveryResponse[]> {
    const address = this.configService.reputationOracleAddress;
    const chainIds = this.configService.chainIdsEnabled;
    const filteredOracles = await Promise.all(
      chainIds.map(async (chainId) => {
        return await this.findOraclesByChainId(
          chainId,
          address,
          command.selectedJobTypes,
        );
      }),
    );
    return filteredOracles.flat().filter(Boolean) as OracleDiscoveryResponse[];
  }
  private async findOraclesByChainId(
    chainId: string,
    address: string,
    selectedJobTypes: string[] | undefined,
  ): Promise<OracleDiscoveryResponse[]> {
    let receivedOracles: OracleDiscoveryResponse[] | undefined =
      await this.cacheManager.get(chainId);
    if (receivedOracles) {
      return receivedOracles;
    }
    try {
      receivedOracles = await OperatorUtils.getReputationNetworkOperators(
        Number(chainId),
        address,
        this.EXCHANGE_ORACLE,
      );
      const filteredOracles = this.filterOracles(
        receivedOracles,
        selectedJobTypes,
      );
      await this.cacheManager.set(
        chainId,
        filteredOracles,
        {
          ttl: this.configService.cacheTtlOracleDiscovery
        } as any,
      );
      return filteredOracles;
    } catch (error) {
      this.logger.error(`Error processing chainId ${chainId}:`, error);
    }
    return [];
  }
  private filterOracles(
    foundOracles: OracleDiscoveryResponse[] | undefined,
    selectedJobTypes: string[] | undefined,
  ) {
    if (foundOracles && foundOracles.length > 0) {
      const filteredOracles = foundOracles.filter((oracle) => {
        if (!oracle.url || oracle.url === null) {
          return false;
        }
        return true;
      });
      if (selectedJobTypes && selectedJobTypes.length > 0) {
        return filteredOracles.filter((oracle) =>
          oracle.jobTypes && oracle.jobTypes.length > 0
            ? this.areJobTypeSetsIntersect(oracle.jobTypes, selectedJobTypes)
            : false,
        );
      }
      return filteredOracles;
    }
    return [];
  }
  private areJobTypeSetsIntersect(
    oracleJobTypes: string[],
    requiredJobTypes: string[],
  ) {
    return oracleJobTypes.some((job) =>
      requiredJobTypes
        .map((requiredJob) => requiredJob.toLowerCase())
        .includes(job.toLowerCase()),
    );
  }
}
