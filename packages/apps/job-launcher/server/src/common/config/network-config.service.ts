import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

    // Remove networks without RPC URLs
    Object.keys(this.networkMap).forEach((network) => {
      if (!this.networkMap[network].rpcUrl) {
        delete this.networkMap[network];
      }
    });
  }

  get networks(): NetworkDto[] {
    return Object.values(this.networkMap).map((network) => network);
  }
}