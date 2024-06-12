import { HttpStatus, Injectable } from '@nestjs/common';
import { Wallet, ethers } from 'ethers';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ErrorWeb3 } from '../../common/constants/errors';
import { ControlledError } from '../../common/errors/controlled';

@Injectable()
export class Web3Service {
  private signers: { [key: number]: Wallet } = {};
  public readonly signerAddress: string;

  constructor(
    public readonly web3ConfigService: Web3ConfigService,
    public readonly networkConfigService: NetworkConfigService,
  ) {
    const privateKey = this.web3ConfigService.privateKey;

    if (!this.networkConfigService.networks.length) {
      throw new ControlledError(
        ErrorWeb3.NoValidNetworks,
        HttpStatus.BAD_REQUEST,
      );
    }

    for (const network of this.networkConfigService.networks) {
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      this.signers[network.chainId] = new Wallet(privateKey, provider);
    }
  }

  public getSigner(chainId: number): Wallet {
    this.validateChainId(chainId);
    return this.signers[chainId];
  }

  public validateChainId(chainId: number): void {
    if (!this.signers[chainId]) {
      throw new ControlledError(
        ErrorWeb3.InvalidChainId,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public async calculateGasPrice(chainId: number): Promise<bigint> {
    const signer = this.getSigner(chainId);
    const multiplier = this.web3ConfigService.gasPriceMultiplier;
    const gasPrice = (await signer.provider?.getFeeData())?.gasPrice;
    if (gasPrice) {
      return gasPrice * BigInt(multiplier);
    }
    throw new ControlledError(ErrorWeb3.GasPriceError, HttpStatus.CONFLICT);
  }

  public getOperatorAddress(): string {
    return Object.values(this.signers)[0].address;
  }
}
