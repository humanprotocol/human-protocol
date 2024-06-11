import { ChainId } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Web3Env } from '../enums/web3';
import {
  LOCALHOST_CHAIN_IDS,
  MAINNET_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
} from '../constants/networks';

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

  constructor(private configService: ConfigService) {
    this.networkMap = {
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
