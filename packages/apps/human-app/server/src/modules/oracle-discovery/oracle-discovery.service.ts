import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  OracleDiscoveryCommand,
  OracleDiscoveryResponse,
} from './model/oracle-discovery.model';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IOperator, OperatorUtils, Role } from '@human-protocol/sdk';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';

@Injectable()
export class OracleDiscoveryService {
  logger = new Logger(OracleDiscoveryService.name);

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

    // Filter out inactive oracles before returning
    return filteredOracles
      .flat()
      .filter(
        (oracle) => oracle.retriesCount < this.configService.maxRequestRetries,
      ) as OracleDiscoveryResponse[];
  }

  private async findOraclesByChainId(
    chainId: string,
    address: string,
    selectedJobTypes: string[] | undefined,
  ): Promise<OracleDiscoveryResponse[]> {
    const receivedOracles: OracleDiscoveryResponse[] | undefined =
      await this.cacheManager.get(chainId);
    if (receivedOracles) {
      return receivedOracles;
    }
    try {
      const operators: IOperator[] =
        await OperatorUtils.getReputationNetworkOperators(
          Number(chainId),
          address,
          Role.ExchangeOracle,
        );

      const oraclesWithRetryData = operators.map(
        (operator) =>
          new OracleDiscoveryResponse(
            operator.address,
            chainId,
            operator.role,
            operator.url,
            operator.jobTypes,
          ),
      );

      // Filter based on selected job types, and cache the result
      const filteredOracles = this.filterOracles(
        oraclesWithRetryData,
        selectedJobTypes,
      );
      await this.cacheManager.set(
        chainId,
        filteredOracles,
        this.configService.cacheTtlOracleDiscovery,
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
