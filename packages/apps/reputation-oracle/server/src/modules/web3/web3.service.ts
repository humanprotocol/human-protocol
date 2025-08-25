import { ChainId } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { Wallet, ethers } from 'ethers';

import { Web3ConfigService, Web3Network } from '@/config';

import type { Chain, WalletWithProvider } from './types';

export const supportedChainIdsByNetwork = {
  [Web3Network.MAINNET]: [ChainId.POLYGON, ChainId.BSC_MAINNET],
  [Web3Network.TESTNET]: [
    ChainId.POLYGON_AMOY,
    ChainId.BSC_TESTNET,
    ChainId.SEPOLIA,
    ChainId.AURORA_TESTNET,
  ],
  [Web3Network.LOCAL]: [ChainId.LOCALHOST],
} as const;

@Injectable()
export class Web3Service {
  private signersByChainId: {
    [chainId: number]: WalletWithProvider;
  } = {};

  constructor(private readonly web3ConfigService: Web3ConfigService) {
    const privateKey = this.web3ConfigService.privateKey;

    for (const chain of this.supportedChains) {
      const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
      this.signersByChainId[chain.id] = new Wallet(
        privateKey,
        provider,
      ) as WalletWithProvider;
    }
  }

  private get supportedChainIds(): ChainId[] {
    const configuredNewtork = this.web3ConfigService.network;

    const supportedChainIds = supportedChainIdsByNetwork[configuredNewtork];

    if (!supportedChainIds) {
      throw new Error(
        `${configuredNewtork} network is missing chain ids mapping`,
      );
    }

    return [...supportedChainIds];
  }

  private get supportedChains(): Chain[] {
    const supportedChains: Chain[] = [];

    for (const chainId of this.supportedChainIds) {
      const rpcUrl = this.web3ConfigService.getRpcUrlByChainId(chainId);
      if (!rpcUrl) {
        continue;
      }

      supportedChains.push({
        id: chainId,
        rpcUrl,
      });
    }

    if (!supportedChains.length) {
      throw new Error('Supported chains not configured');
    }

    return supportedChains;
  }

  getSigner(chainId: number): WalletWithProvider {
    const signer = this.signersByChainId[chainId];

    if (signer) {
      return signer;
    }

    throw new Error(`No signer for provided chain id: ${chainId}`);
  }

  async calculateGasPrice(chainId: number): Promise<bigint> {
    const signer = this.getSigner(chainId);
    const { gasPrice } = await signer.provider.getFeeData();

    if (gasPrice) {
      return gasPrice * BigInt(this.web3ConfigService.gasPriceMultiplier);
    }

    throw new Error(`No gas price data for chain id: ${chainId}`);
  }
}
