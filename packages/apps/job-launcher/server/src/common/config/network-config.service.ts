import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Web3Env } from '../enums/web3';
import {
  LOCALHOST_CHAIN_IDS,
  MAINNET_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
} from '../constants';

export interface TokensList {
  [key: string]: string | undefined;
}
export interface NetworkDto {
  chainId: number;
  rpcUrl?: string;
  tokens: TokensList;
}

interface NetworkMapDto {
  [key: string]: NetworkDto;
}

@Injectable()
export class NetworkConfigService {
  private readonly networkMap: NetworkMapDto;

  constructor(private configService: ConfigService) {
    this.networkMap = {
      ...(this.configService.get<string>('RPC_URL_SEPOLIA') && {
        sepolia: {
          chainId: ChainId.SEPOLIA,
          rpcUrl: this.configService.get<string>('RPC_URL_SEPOLIA'),
          tokens: {
            hmt: NETWORKS[ChainId.SEPOLIA]?.hmtAddress,
          },
        },
      }),
      ...(this.configService.get<string>('RPC_URL_POLYGON') && {
        polygon: {
          chainId: ChainId.POLYGON,
          rpcUrl: this.configService.get<string>('RPC_URL_POLYGON'),
          tokens: {
            hmt: NETWORKS[ChainId.POLYGON]?.hmtAddress,
            usdt: '0x170a18b9190669cda08965562745a323c907e5ec',
          },
        },
      }),
      ...(this.configService.get<string>('RPC_URL_POLYGON_AMOY') && {
        amoy: {
          chainId: ChainId.POLYGON_AMOY,
          rpcUrl: this.configService.get<string>('RPC_URL_POLYGON_AMOY'),
          tokens: {
            hmt: NETWORKS[ChainId.POLYGON_AMOY]?.hmtAddress,
          },
        },
      }),
      ...(this.configService.get<string>('RPC_URL_BSC_MAINNET') && {
        bsc: {
          chainId: ChainId.BSC_MAINNET,
          rpcUrl: this.configService.get<string>('RPC_URL_BSC_MAINNET'),
          tokens: {
            hmt: NETWORKS[ChainId.BSC_MAINNET]?.hmtAddress,
            usdt: '0x55d398326f99059fF775485246999027B3197955',
          },
        },
      }),
      ...(this.configService.get<string>('RPC_URL_BSC_TESTNET') && {
        bsctest: {
          chainId: ChainId.BSC_TESTNET,
          rpcUrl: this.configService.get<string>('RPC_URL_BSC_TESTNET'),
          tokens: {
            hmt: NETWORKS[ChainId.BSC_TESTNET]?.hmtAddress,
          },
        },
      }),
      ...(this.configService.get<string>('RPC_URL_MOONBEAM') && {
        moonbeam: {
          chainId: ChainId.MOONBEAM,
          rpcUrl: this.configService.get<string>('RPC_URL_MOONBEAM'),
          tokens: {
            hmt: NETWORKS[ChainId.MOONBEAM]?.hmtAddress,
          },
        },
      }),
      ...(this.configService.get<string>('RPC_URL_XLAYER_TESTNET') && {
        xlayertestnet: {
          chainId: ChainId.XLAYER_TESTNET,
          rpcUrl: this.configService.get<string>('RPC_URL_XLAYER_TESTNET'),
          tokens: {
            hmt: NETWORKS[ChainId.XLAYER_TESTNET]?.hmtAddress,
          },
        },
      }),
      ...(this.configService.get<string>('RPC_URL_XLAYER') && {
        xlayer: {
          chainId: ChainId.XLAYER,
          rpcUrl: this.configService.get<string>('RPC_URL_XLAYER'),
          tokens: {
            hmt: NETWORKS[ChainId.XLAYER]?.hmtAddress,
          },
        },
      }),
      ...(this.configService.get<string>('RPC_URL_LOCALHOST') && {
        localhost: {
          chainId: ChainId.LOCALHOST,
          rpcUrl: this.configService.get<string>('RPC_URL_LOCALHOST'),
          tokens: {
            hmt: NETWORKS[ChainId.LOCALHOST]?.hmtAddress,
          },
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
}
