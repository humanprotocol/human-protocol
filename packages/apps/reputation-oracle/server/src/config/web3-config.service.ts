import { ChainId } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Wallet } from 'ethers';

export enum Web3Network {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  LOCAL = 'localost',
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
    return this.configService.get<Web3Network>('WEB3_ENV', Web3Network.TESTNET);
  }

  /**
   * The private key used for signing transactions.
   * Required
   */
  get privateKey(): string {
    return this.configService.getOrThrow<string>('WEB3_PRIVATE_KEY');
  }

  /**
   * Returns chain id of the reputation network
   * where this oracle operates on (e.g. KVStore)
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
    return +this.configService.get<number>('GAS_PRICE_MULTIPLIER', 1);
  }

  getRpcUrlByChainId(chainId: number): string | undefined {
    const rpcUrlsByChainId: Record<string, string | undefined> = {
      [ChainId.POLYGON]: this.configService.get<string>('RPC_URL_POLYGON'),
      [ChainId.POLYGON_AMOY]: this.configService.get<string>(
        'RPC_URL_POLYGON_AMOY',
      ),
      [ChainId.BSC_MAINNET]: this.configService.get<string>(
        'RPC_URL_BSC_MAINNET',
      ),
      [ChainId.BSC_TESTNET]: this.configService.get<string>(
        'RPC_URL_BSC_TESTNET',
      ),
      [ChainId.SEPOLIA]: this.configService.get<string>('RPC_URL_SEPOLIA'),
      [ChainId.LOCALHOST]: this.configService.get<string>('RPC_URL_LOCALHOST'),
    };

    return rpcUrlsByChainId[chainId];
  }
}
