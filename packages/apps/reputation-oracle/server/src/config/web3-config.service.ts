import { ChainId } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Wallet } from 'ethers';

export enum Web3Network {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  LOCAL = 'localhost',
}

@Injectable()
export class Web3ConfigService {
  readonly operatorAddress: string;

  constructor(private configService: ConfigService) {
    const wallet = new Wallet(this.privateKey);
    this.operatorAddress = wallet.address;
  }

  /**
   * The environment in which the Web3 application is running.
   * Default: 'testnet'
   */
  get network(): Web3Network {
    return this.configService.get('WEB3_ENV', Web3Network.TESTNET);
  }

  /**
   * The private key used for signing transactions.
   * Required
   */
  get privateKey(): string {
    return this.configService.getOrThrow('WEB3_PRIVATE_KEY');
  }

  /**
   * Returns chain id reputation oracle operates on
   */
  get reputationNetworkChainId(): ChainId {
    switch (this.network) {
      case Web3Network.MAINNET:
        return ChainId.POLYGON;
      case Web3Network.TESTNET:
        return ChainId.POLYGON_AMOY;
      case Web3Network.LOCAL:
        return ChainId.LOCALHOST;
    }
  }

  /**
   * Multiplier for gas price adjustments.
   * Default: 1
   */
  get gasPriceMultiplier(): number {
    return Number(this.configService.get('GAS_PRICE_MULTIPLIER')) || 1;
  }

  getRpcUrlByChainId(chainId: number): string | undefined {
    const rpcUrlsByChainId: Record<string, string | undefined> = {
      [ChainId.POLYGON]: this.configService.get('RPC_URL_POLYGON'),
      [ChainId.POLYGON_AMOY]: this.configService.get('RPC_URL_POLYGON_AMOY'),
      [ChainId.BSC_MAINNET]: this.configService.get('RPC_URL_BSC_MAINNET'),
      [ChainId.BSC_TESTNET]: this.configService.get('RPC_URL_BSC_TESTNET'),
      [ChainId.AURORA_TESTNET]: this.configService.get(
        'RPC_URL_AURORA_TESTNET',
      ),
      [ChainId.SEPOLIA]: this.configService.get('RPC_URL_SEPOLIA'),
      [ChainId.LOCALHOST]: this.configService.get('RPC_URL_LOCALHOST'),
    };

    return rpcUrlsByChainId[chainId];
  }
}
