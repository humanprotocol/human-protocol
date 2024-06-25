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

    const allData = await Promise.all(
      chainIds.map(async (chainId) => {
        let data: OracleDiscoveryResponse[] | undefined =
          await this.cacheManager.get(chainId);
        if (!data) {
          try {
            data = await OperatorUtils.getReputationNetworkOperators(
              Number(chainId),
              address,
              this.EXCHANGE_ORACLE,
            );
            await this.cacheManager.set(
              chainId,
              data,
              this.configService.cacheTtlOracleDiscovery,
            );
          } catch (error) {
            this.logger.error(`Error processing chainId ${chainId}:`, error);
          }
        }
        if (command.selectedJobTypes) {
          return data?.filter((oracle) =>
            oracle.jobTypes?.some((job) =>
              command.selectedJobTypes?.includes(job),
            ),
          );
        }
        return data;
      }),
    );

    return allData.flat().filter(Boolean) as OracleDiscoveryResponse[];
  }
}
