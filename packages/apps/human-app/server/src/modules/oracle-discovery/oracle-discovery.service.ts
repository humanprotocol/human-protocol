import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  OracleDiscoveryCommand,
  OracleDiscoveryResponse,
} from './model/oracle-discovery.model';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ChainId, IOperator, OperatorUtils, Role } from '@human-protocol/sdk';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { KvStoreGateway } from '../../integrations/kv-store/kv-store.gateway';

@Injectable()
export class OracleDiscoveryService {
  logger = new Logger(OracleDiscoveryService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: EnvironmentConfigService,
    private kvStoreGateway: KvStoreGateway,
  ) {}

  async processOracleDiscovery(
    command: OracleDiscoveryCommand,
  ): Promise<OracleDiscoveryResponse[]> {
    const address = this.configService.reputationOracleAddress;
    const chainIds = this.configService.chainIdsEnabled;
    const jobTypesByChainId = new Map<ChainId, string[]>();

    const oraclesForChainIds = await Promise.all(
      chainIds.map(async (chainId) => {
        const jobTypes = (
          (await this.kvStoreGateway.getJobTypesByAddress(address)) ?? ''
        )
          .split(',')
          .map((job) => job.trim().toLowerCase());

        jobTypesByChainId.set(+chainId, jobTypes);

        return this.findOraclesByChainId(chainId, address, jobTypes);
      }),
    );

    const filteredOracles: OracleDiscoveryResponse[] = [];
    for (const oraclesForChainId of oraclesForChainIds) {
      for (const oracle of oraclesForChainId) {
        // Filter out inactive oracles
        if (oracle.retriesCount >= this.configService.maxRequestRetries) {
          continue;
        }

        if (command.selectedJobTypes?.length) {
          // Keep only oracles that have at least one selected job type
          const oracleJobTypesSet = new Set(oracle.jobTypes || []);
          let oracleHasSomeSelectedJobType = false;
          for (const selectedJobType of command.selectedJobTypes) {
            if (oracleJobTypesSet.has(selectedJobType)) {
              oracleHasSomeSelectedJobType = true;
              break;
            }
          }
          if (!oracleHasSomeSelectedJobType) {
            continue;
          }
        }

        filteredOracles.push(oracle);
      }
    }

    return filteredOracles;
  }

  private async findOraclesByChainId(
    chainId: string,
    address: string,
    jobTypes: string[],
  ): Promise<OracleDiscoveryResponse[]> {
    try {
      const cachedOracles: OracleDiscoveryResponse[] | undefined =
        await this.cacheManager.get(chainId);

      if (cachedOracles) {
        return cachedOracles;
      }

      const operators: IOperator[] =
        await OperatorUtils.getReputationNetworkOperators(
          Number(chainId),
          address,
          Role.ExchangeOracle,
        );

      const filteredOracles = this.filterOracles(operators, jobTypes);

      const oraclesWithRetryData: OracleDiscoveryResponse[] = [];
      for (const operator of filteredOracles) {
        const isOperatorValid = !!operator.url;

        if (isOperatorValid) {
          oraclesWithRetryData.push(
            new OracleDiscoveryResponse(
              operator.address,
              chainId,
              operator.role,
              operator.url,
              operator.jobTypes,
              operator.registrationNeeded,
              operator.registrationInstructions,
            ),
          );
        }
      }

      await this.cacheManager.set(
        chainId,
        oraclesWithRetryData,
        this.configService.cacheTtlOracleDiscovery,
      );

      return oraclesWithRetryData;
    } catch (error) {
      this.logger.error(`Error processing chainId ${chainId}:`, error);
      return [];
    }
  }

  private filterOracles(foundOracles: IOperator[], jobTypes: string[]) {
    if (foundOracles && foundOracles.length > 0) {
      const filteredOracles = foundOracles.filter((oracle) => {
        if (!oracle.url || oracle.url === null) {
          return false;
        }
        return true;
      });

      if (jobTypes && jobTypes.length > 0) {
        const jobTypeSet = new Set(jobTypes || []);

        return filteredOracles.filter((oracle) =>
          oracle.jobTypes && oracle.jobTypes.length > 0
            ? this.matchesJobTypes(oracle.jobTypes, jobTypeSet)
            : false,
        );
      }
      return filteredOracles;
    }
    return [];
  }

  private matchesJobTypes(oracleJobTypes: string[], jobTypeSet: Set<string>) {
    return oracleJobTypes.some((job) => jobTypeSet.has(job.toLowerCase()));
  }
}
