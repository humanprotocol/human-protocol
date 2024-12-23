import _ from 'lodash';
import { ChainId, IOperator, OperatorUtils, Role } from '@human-protocol/sdk';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  DiscoveredOracle,
  GetOraclesCommand,
} from './model/oracle-discovery.model';
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

  async getOracles(command: GetOraclesCommand): Promise<DiscoveredOracle[]> {
    const oracles = await this.discoverOracles();

    if (!command.selectedJobTypes?.length) {
      return oracles;
    }

    const selectedJobTypesSet = new Set(command.selectedJobTypes);
    return oracles.filter((oracle) =>
      oracle.jobTypes.some((jobType) => selectedJobTypesSet.has(jobType)),
    );
  }

  async discoverOracles(): Promise<DiscoveredOracle[]> {
    const discoveryPromises = [];
    for (const enabledChainId of this.configService.chainIdsEnabled) {
      discoveryPromises.push(this.discoverOraclesForChain(enabledChainId));
    }

    const oraclesDiscoveredForChains = await Promise.all(discoveryPromises);

    return oraclesDiscoveredForChains.flat();
  }

  private async discoverOraclesForChain(
    chainId: ChainId,
  ): Promise<DiscoveredOracle[]> {
    try {
      const cacheKey = chainId.toString();

      const cachedOracles = await this.cacheManager.get<
        DiscoveredOracle[] | undefined
      >(cacheKey);

      if (cachedOracles) {
        return cachedOracles;
      }

      const reputationOracleAddress =
        this.configService.reputationOracleAddress;

      const reputationOracleJobTypesValue =
        await this.kvStoreGateway.getJobTypesByAddress(
          chainId,
          reputationOracleAddress,
        );

      if (!reputationOracleJobTypesValue) {
        return [];
      }
      const reputationOracleJobTypes = reputationOracleJobTypesValue.split(',');

      const exchangeOracles = await OperatorUtils.getReputationNetworkOperators(
        chainId,
        reputationOracleAddress,
        Role.ExchangeOracle,
      );

      const discoveredOracles: DiscoveredOracle[] = [];
      for (const exchangeOracle of exchangeOracles) {
        if (
          OracleDiscoveryService.checkExpectationsOfDiscoveredOracle(
            exchangeOracle,
            reputationOracleJobTypes,
          )
        ) {
          discoveredOracles.push(
            new DiscoveredOracle({
              address: exchangeOracle.address,
              role: exchangeOracle.role,
              url: exchangeOracle.url,
              jobTypes: exchangeOracle.jobTypes,
              registrationNeeded: exchangeOracle.registrationNeeded,
              registrationInstructions: exchangeOracle.registrationInstructions,
              chainId,
            }),
          );
        }
      }

      await this.cacheManager.set(
        cacheKey,
        discoveredOracles,
        this.configService.cacheTtlOracleDiscovery,
      );

      return discoveredOracles;
    } catch (error) {
      this.logger.error(
        `Failed to discover oracles for chain '${chainId}':`,
        error,
      );
      return [];
    }
  }

  static checkExpectationsOfDiscoveredOracle(
    operator: IOperator,
    possibleJobTypes: string[],
  ): operator is DiscoveredOracle {
    if (!operator.url) {
      return false;
    }

    if (_.intersection(operator.jobTypes, possibleJobTypes).length === 0) {
      return false;
    }

    return true;
  }

  async updateOracleInCache(
    oracleWithUpdates: DiscoveredOracle,
  ): Promise<void> {
    const cacheKey = oracleWithUpdates.chainId.toString();

    const cachedOracles = await this.cacheManager.get<
      DiscoveredOracle[] | undefined
    >(cacheKey);

    if (!cachedOracles) {
      return;
    }

    const updatedOracles = cachedOracles.map((cachedOracle) =>
      cachedOracle.address === oracleWithUpdates.address
        ? oracleWithUpdates
        : cachedOracle,
    );

    await this.cacheManager.set(
      cacheKey,
      updatedOracles,
      this.configService.cacheTtlOracleDiscovery,
    );
  }
}
