import { ChainId, IOperator, OperatorUtils, Role } from '@human-protocol/sdk';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import _ from 'lodash';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { KvStoreGateway } from '../../integrations/kv-store/kv-store.gateway';
import logger from '../../logger';
import {
  DiscoveredOracle,
  GetOraclesCommand,
} from './model/oracle-discovery.model';

@Injectable()
export class OracleDiscoveryService {
  private readonly logger = logger.child({
    context: OracleDiscoveryService.name,
  });

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: EnvironmentConfigService,
    private readonly kvStoreGateway: KvStoreGateway,
  ) {}

  async getOracles(command: GetOraclesCommand): Promise<DiscoveredOracle[]> {
    const oracles = await this.discoverOracles();

    if (!command.selectedJobTypes?.length) {
      return oracles;
    }

    const selectedJobTypesSet = new Set(command.selectedJobTypes);
    return oracles.filter((oracle) =>
      oracle.jobTypes?.some((jobType) => selectedJobTypesSet.has(jobType)),
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
              id: exchangeOracle.id,
              address: exchangeOracle.address,
              name: exchangeOracle.name,
              role: exchangeOracle.role,
              url: exchangeOracle.url,
              jobTypes: exchangeOracle.jobTypes,
              registrationNeeded: exchangeOracle.registrationNeeded,
              registrationInstructions: exchangeOracle.registrationInstructions,
              chainId,
              stakedAmount: exchangeOracle.stakedAmount,
              lockedAmount: exchangeOracle.lockedAmount,
              withdrawnAmount: exchangeOracle.withdrawnAmount,
              slashedAmount: exchangeOracle.slashedAmount,
              amountJobsProcessed: exchangeOracle.amountJobsProcessed,
              lastDepositTimestamp: exchangeOracle.lastDepositTimestamp,
              lockedUntilTimestamp: exchangeOracle.lockedUntilTimestamp,
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
      this.logger.error('Failed to discover oracles for chain', {
        chainId,
        error,
      });
      return [];
    }
  }

  static checkExpectationsOfDiscoveredOracle(
    operator: IOperator,
    possibleJobTypes: string[],
  ): operator is DiscoveredOracle {
    if (!operator.url || !operator.name || !operator.role) {
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
