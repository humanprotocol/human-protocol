import { ChainId, NETWORKS, StatisticsClient } from '@human-protocol/sdk';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Web3Env } from '../enums/web3';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { AVAILABLE_NETWORKS_CACHE_KEY } from './redis-config.service';
import {
  EnvironmentConfigService,
  MINIMUM_ESCROWS_COUNT,
  MINIMUM_HMT_TRANSFERS,
} from './env-config.service';
import {
  LOCALHOST_CHAIN_IDS,
  MAINNET_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
} from '../utils/constants';

export interface TokensList {
  [key: string]: string | undefined;
}
export interface NetworkDto {
  chainId: number;
  rpcUrl?: string;
}

interface NetworkMapDto {
  [key: string]: NetworkDto;
}

@Injectable()
export class NetworkConfigService {
  private readonly networkMap: NetworkMapDto;
  private readonly logger = new Logger(NetworkConfigService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly envConfigService: EnvironmentConfigService,
    private configService: ConfigService,
  ) {
    this.networkMap = {
      ...(this.configService.get<string>('RPC_URL_ETHEREUM') && {
        ethereum: {
          chainId: ChainId.MAINNET,
          rpcUrl: this.configService.get<string>('RPC_URL_ETHEREUM'),
        },
      }),
      ...(this.configService.get<string>('RPC_URL_SEPOLIA') && {
        sepolia: {
          chainId: ChainId.SEPOLIA,
          rpcUrl: this.configService.get<string>('RPC_URL_SEPOLIA'),
        },
      }),
      ...(this.configService.get<string>('RPC_URL_POLYGON') && {
        polygon: {
          chainId: ChainId.POLYGON,
          rpcUrl: this.configService.get<string>('RPC_URL_POLYGON'),
        },
      }),
      ...(this.configService.get<string>('RPC_URL_POLYGON_AMOY') && {
        amoy: {
          chainId: ChainId.POLYGON_AMOY,
          rpcUrl: this.configService.get<string>('RPC_URL_POLYGON_AMOY'),
        },
      }),
      ...(this.configService.get<string>('RPC_URL_BSC_MAINNET') && {
        bsc: {
          chainId: ChainId.BSC_MAINNET,
          rpcUrl: this.configService.get<string>('RPC_URL_BSC_MAINNET'),
        },
      }),
      ...(this.configService.get<string>('RPC_URL_BSC_TESTNET') && {
        bsctest: {
          chainId: ChainId.BSC_TESTNET,
          rpcUrl: this.configService.get<string>('RPC_URL_BSC_TESTNET'),
        },
      }),
      ...(this.configService.get<string>('RPC_URL_MOONBEAM') && {
        moonbeam: {
          chainId: ChainId.MOONBEAM,
          rpcUrl: this.configService.get<string>('RPC_URL_MOONBEAM'),
        },
      }),
      ...(this.configService.get<string>('RPC_URL_XLAYER_TESTNET') && {
        xlayertestnet: {
          chainId: ChainId.XLAYER_TESTNET,
          rpcUrl: this.configService.get<string>('RPC_URL_XLAYER_TESTNET'),
        },
      }),
      ...(this.configService.get<string>('RPC_URL_XLAYER') && {
        xlayer: {
          chainId: ChainId.XLAYER,
          rpcUrl: this.configService.get<string>('RPC_URL_XLAYER'),
        },
      }),
      ...(this.configService.get<string>('RPC_URL_LOCALHOST') && {
        localhost: {
          chainId: ChainId.LOCALHOST,
          rpcUrl: this.configService.get<string>('RPC_URL_LOCALHOST'),
        },
      }),
    };
    const validChainIds = (() => {
      switch (this.configService.get<string>('WEB3_ENV')) {
        case Web3Env.MAINNET:
          return MAINNET_CHAIN_IDS;
        case Web3Env.LOCALHOST:
          return LOCALHOST_CHAIN_IDS;
        default:
          return TESTNET_CHAIN_IDS;
      }
    })();

    // Remove networks without RPC URLs
    this.networkMap = Object.keys(this.networkMap)
      .filter((network) => {
        const networkConfig = this.networkMap[network];
        return (
          networkConfig.rpcUrl && validChainIds.includes(networkConfig.chainId)
        );
      })
      .reduce((newNetworkMap: NetworkMapDto, network) => {
        newNetworkMap[network] = this.networkMap[network];
        return newNetworkMap;
      }, {});
  }

  get networks(): NetworkDto[] {
    return Object.values(this.networkMap).map((network) => network);
  }

  public async getAvailableNetworks(): Promise<ChainId[]> {
    const cachedNetworks = await this.cacheManager.get<ChainId[]>(
      AVAILABLE_NETWORKS_CACHE_KEY,
    );

    if (cachedNetworks) {
      return cachedNetworks;
    }

    const currentMonth = new Date();
    const oneMonthAgo = new Date(currentMonth);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const filterDate = new Date(currentMonth);
    filterDate.setMonth(
      filterDate.getMonth() - this.envConfigService.networkUsageFilterMonths,
    );

    const availableNetworks = [];

    for (const network of Object.values(this.networks)) {
      const chainId = network.chainId;

      const networkConfig = NETWORKS[chainId];

      if (!networkConfig) {
        continue;
      }

      const statisticsClient = new StatisticsClient(networkConfig);

      try {
        const hmtData = await statisticsClient.getHMTDailyData({
          from: new Date(Math.floor(filterDate.getTime() / 1000) * 1000),
        });
        const escrowStats = await statisticsClient.getEscrowStatistics({
          from: new Date(Math.floor(oneMonthAgo.getTime() / 1000) * 1000),
        });

        // Calculate total HMT transaction count across the period
        const totalTransactionCount = hmtData.reduce(
          (sum, day) => sum + day.totalTransactionCount,
          0,
        );

        // At least 1 escrow created in the last month
        const recentEscrowsCreated =
          escrowStats.totalEscrows >= MINIMUM_ESCROWS_COUNT;
        // Total HMT transactions > MINIMUM_HMT_TRANSFERS in the last X months
        const sufficientHMTTransfers =
          totalTransactionCount > MINIMUM_HMT_TRANSFERS;

        if (recentEscrowsCreated && sufficientHMTTransfers) {
          availableNetworks.push(chainId);
        }
      } catch (error) {
        this.logger.error(
          `Error processing network Chain ID: ${chainId}): ${error.message}`,
        );
      }
    }

    await this.cacheManager.set(
      AVAILABLE_NETWORKS_CACHE_KEY,
      availableNetworks,
      this.envConfigService.networkAvailableCacheTtl,
    );
    return availableNetworks;
  }
}
