import { Inject, Injectable } from '@nestjs/common';
import {
  OracleDiscoveryCommand,
  OracleDiscoveryResponse,
} from './interface/oracle-discovery.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { OperatorUtils } from '@human-protocol/sdk';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
@Injectable()
export class OracleDiscoveryService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: EnvironmentConfigService,
  ) {}

  async processOracleDiscovery(
    command: OracleDiscoveryCommand,
  ): Promise<OracleDiscoveryResponse[]> {
    let data: OracleDiscoveryResponse[] | undefined =
      await this.cacheManager.get(command.address);
    if (!data) {
      data = await OperatorUtils.getReputationNetworkOperators(
        command.chainId,
        command.address,
        command.role,
      );
      await this.cacheManager.set(
        command.address,
        data,
        this.configService.cacheTtlOracleDiscovery,
      );
    }
    return data;
  }
}
