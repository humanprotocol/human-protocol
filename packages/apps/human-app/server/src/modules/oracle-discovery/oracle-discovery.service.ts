import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  OracleDiscoveryCommand,
  OracleDiscoveryResponse,
} from './model/oracle-discovery.model';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ChainId, OperatorUtils, Role } from '@human-protocol/sdk';
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

    const oraclesForChainIds = await Promise.all(
      chainIds.map(async (chainId) => {
        const jobTypes = (
          (await this.kvStoreGateway.getJobTypesByAddress(chainId, address)) ??
          ''
        )
          .split(',')
          .map((job) => job.trim().toLowerCase());

        return this.findOraclesByChainIdAndJobTypes(chainId, address, jobTypes);
      }),
    );

    const filteredOracles: OracleDiscoveryResponse[] = [];
    for (const oraclesForChainId of oraclesForChainIds) {
      for (const oracle of oraclesForChainId) {
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

  private async findOraclesByChainIdAndJobTypes(
    chainId: ChainId,
    address: string,
    jobTypes: string[],
  ): Promise<OracleDiscoveryResponse[]> {
    try {
      const cachedOracles = await this.cacheManager.get<
        OracleDiscoveryResponse[]
      >(chainId.toString());
      if (cachedOracles) return cachedOracles;

      const operators = await OperatorUtils.getReputationNetworkOperators(
        Number(chainId),
        address,
        Role.ExchangeOracle,
      );

      const jobTypeSet = new Set(jobTypes.map((j) => j.toLowerCase()));

      const oraclesWithRetryData: OracleDiscoveryResponse[] = operators
        .filter(
          (operator) =>
            operator.url && this.hasJobTypes(operator.jobTypes, jobTypeSet),
        )
        .map(
          (operator) =>
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

      await this.cacheManager.set(
        chainId.toString(),
        oraclesWithRetryData,
        this.configService.cacheTtlOracleDiscovery,
      );

      return oraclesWithRetryData;
    } catch (error) {
      this.logger.error(`Error processing chainId ${chainId}:`, error);
      return [];
    }
  }

  private hasJobTypes(
    oracleJobTypes: string[] | undefined,
    jobTypeSet: Set<string>,
  ) {
    return oracleJobTypes
      ? oracleJobTypes.some((job) => jobTypeSet.has(job.toLowerCase()))
      : false;
  }
}
