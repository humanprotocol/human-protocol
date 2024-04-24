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
        rpcUrl: this.configService.get<string>('POLYGON_RPC_URL'),
      },
      bsc: {
        chainId: ChainId.BSC_MAINNET,
        rpcUrl: this.configService.get<string>('BSC_RPC_URL'),
      },
      amoy: {
        chainId: ChainId.POLYGON_AMOY,
        rpcUrl: this.configService.get<string>('AMOY_RPC_URL'),
      },
      goerli: {
        chainId: ChainId.GOERLI,
        rpcUrl: this.configService.get<string>('GOERLI_RPC_URL'),
      },
      sepolia: {
        chainId: ChainId.SEPOLIA,
        rpcUrl: this.configService.get<string>('SEPOLIA_RPC_URL'),
      },
      moonbeam: {
        chainId: ChainId.MOONBEAM,
        rpcUrl: this.configService.get<string>('MOONBEAM_RPC_URL'),
      },
      bsctest: {
        chainId: ChainId.BSC_TESTNET,
        rpcUrl: this.configService.get<string>('BSC_TESTNET_RPC_URL'),
      },
      localhost: {
        chainId: ChainId.LOCALHOST,
        rpcUrl: this.configService.get<string>('LOCALHOST_RPC_URL'),
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
