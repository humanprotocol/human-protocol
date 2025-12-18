import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  DevelopmentChainId,
  ProductionChainId,
  ChainIds,
  type ChainId,
} from '../constants';

export interface TokensList {
  [key: string]: string | undefined;
}
export interface NetworkDto {
  chainId: ChainId;
  rpcUrl?: string;
}

interface NetworkMapDto {
  [key: string]: NetworkDto;
}

@Injectable()
export class NetworkConfigService {
  private readonly networkMap: NetworkMapDto;

  constructor(private configService: ConfigService) {
    this.networkMap = {
      ...(this.configService.get<string>('RPC_URL_ETHEREUM') && {
        ethereum: {
          chainId: ProductionChainId.ETHEREUM,
          rpcUrl: this.configService.get<string>('RPC_URL_ETHEREUM'),
        },
      }),
      ...(this.configService.get<string>('RPC_URL_SEPOLIA') && {
        sepolia: {
          chainId: DevelopmentChainId.SEPOLIA,
          rpcUrl: this.configService.get<string>('RPC_URL_SEPOLIA'),
        },
      }),
      ...(this.configService.get<string>('RPC_URL_POLYGON') && {
        polygon: {
          chainId: ProductionChainId.POLYGON_MAINNET,
          rpcUrl: this.configService.get<string>('RPC_URL_POLYGON'),
        },
      }),
      ...(this.configService.get<string>('RPC_URL_POLYGON_AMOY') && {
        amoy: {
          chainId: DevelopmentChainId.POLYGON_AMOY,
          rpcUrl: this.configService.get<string>('RPC_URL_POLYGON_AMOY'),
        },
      }),
      ...(this.configService.get<string>('RPC_URL_BSC_MAINNET') && {
        bsc: {
          chainId: ProductionChainId.BSC_MAINNET,
          rpcUrl: this.configService.get<string>('RPC_URL_BSC_MAINNET'),
        },
      }),
      ...(this.configService.get<string>('RPC_URL_BSC_TESTNET') && {
        bsctest: {
          chainId: DevelopmentChainId.BSC_TESTNET,
          rpcUrl: this.configService.get<string>('RPC_URL_BSC_TESTNET'),
        },
      }),
      ...(this.configService.get<string>('RPC_URL_LOCALHOST') && {
        localhost: {
          chainId: DevelopmentChainId.LOCALHOST,
          rpcUrl: this.configService.get<string>('RPC_URL_LOCALHOST'),
        },
      }),
    };

    // Remove networks without RPC URLs
    this.networkMap = Object.keys(this.networkMap)
      .filter((network) => {
        const networkConfig = this.networkMap[network];
        return networkConfig.rpcUrl && ChainIds.includes(networkConfig.chainId);
      })
      .reduce((newNetworkMap: NetworkMapDto, network) => {
        newNetworkMap[network] = this.networkMap[network];
        return newNetworkMap;
      }, {});
  }

  get networks(): NetworkDto[] {
    return Object.values(this.networkMap).map((network) => network);
  }
}
