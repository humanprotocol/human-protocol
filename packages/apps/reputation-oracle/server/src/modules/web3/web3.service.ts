import { Injectable } from '@nestjs/common';
import { Provider, Wallet, ethers } from 'ethers';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { NetworkConfigService } from '../../common/config/network-config.service';

type WalletWithProvider = Wallet & { provider: Provider };

@Injectable()
export class Web3Service {
  private signersByChainId: {
    [chainId: number]: WalletWithProvider;
  } = {};

  constructor(
    private readonly web3ConfigService: Web3ConfigService,
    private readonly networkConfigService: NetworkConfigService,
  ) {
    const privateKey = this.web3ConfigService.privateKey;

    if (!this.networkConfigService.networks.length) {
      throw new Error('No networks specified in network config');
    }

    for (const network of this.networkConfigService.networks) {
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      this.signersByChainId[network.chainId] = new Wallet(
        privateKey,
        provider,
      ) as WalletWithProvider;
    }
  }

  public getSigner(chainId: number): WalletWithProvider {
    const signer = this.signersByChainId[chainId];

    if (signer) {
      return signer;
    }

    throw new Error(`No signer for provided chain id: ${chainId}`);
  }

  public async calculateGasPrice(chainId: number): Promise<bigint> {
    const signer = this.getSigner(chainId);
    const multiplier = this.web3ConfigService.gasPriceMultiplier;
    const gasPrice = (await signer.provider.getFeeData()).gasPrice;

    if (gasPrice) {
      return gasPrice * BigInt(multiplier);
    }

    throw new Error(`No gas price data for chain id: ${chainId}`);
  }

  public getOperatorAddress(): string {
    return Object.values(this.signersByChainId)[0].address;
  }
}
