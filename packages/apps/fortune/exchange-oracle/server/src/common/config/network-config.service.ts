import { ChainId } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
      polygon: {
        chainId: ChainId.POLYGON,
        rpcUrl: this.configService.get<string>('RPC_URL_POLYGON'),
      },
      bsc: {
        chainId: ChainId.BSC_MAINNET,
        rpcUrl: this.configService.get<string>('RPC_URL_BSC'),
      },
      amoy: {
        chainId: ChainId.POLYGON_AMOY,
        rpcUrl: this.configService.get<string>('RPC_URL_AMOY'),
      },
      goerli: {
        chainId: ChainId.GOERLI,
        rpcUrl: this.configService.get<string>('RPC_URL_GOERLI'),
      },
      sepolia: {
        chainId: ChainId.SEPOLIA,
        rpcUrl: this.configService.get<string>('RPC_URL_SEPOLIA'),
      },
      moonbeam: {
        chainId: ChainId.MOONBEAM,
        rpcUrl: this.configService.get<string>('RPC_URL_MOONBEAM'),
      },
      bsctest: {
        chainId: ChainId.BSC_TESTNET,
        rpcUrl: this.configService.get<string>('RPC_URL_BSC_TESTNET'),
      },
      localhost: {
        chainId: ChainId.LOCALHOST,
        rpcUrl: this.configService.get<string>('RPC_URL_LOCALHOST'),
      },
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
