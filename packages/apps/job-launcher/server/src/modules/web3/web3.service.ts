import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Wallet, ethers } from 'ethers';
import { ConfigNames, networks } from '../../common/config';
import { Web3Env } from '../../common/enums/web3';
import {
  LOCALHOST_CHAIN_IDS,
  MAINNET_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
} from '../../common/constants';
import { ErrorWeb3 } from '../../common/constants/errors';
import { ChainId } from '@human-protocol/sdk';

@Injectable()
export class Web3Service {
  private signers: { [key: number]: Wallet } = {};
  public readonly logger = new Logger(Web3Service.name);
  public readonly signerAddress: string;
  public readonly currentWeb3Env: string;

  constructor(private readonly configService: ConfigService) {
    this.currentWeb3Env = this.configService.get(
      ConfigNames.WEB3_ENV,
    ) as string;
    const privateKey = this.configService.get(ConfigNames.WEB3_PRIVATE_KEY);
    const validChains = this.getValidChains();
    const validNetworks = networks.filter((network) =>
      validChains.includes(network.chainId),
    );
    for (const network of validNetworks) {
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      this.signers[network.chainId] = new Wallet(privateKey, provider);
    }
    this.signerAddress = this.signers[validChains[0]].address;
  }

  public getSigner(chainId: number): Wallet {
    this.validateChainId(chainId);
    return this.signers[chainId];
  }

  public validateChainId(chainId: number): void {
    const validChainIds = this.getValidChains();
    if (!validChainIds.includes(chainId)) {
      this.logger.log(ErrorWeb3.InvalidChainId, Web3Service.name);
      throw new BadRequestException(ErrorWeb3.InvalidChainId);
    }
  }

  public getValidChains(): ChainId[] {
    switch (this.currentWeb3Env) {
      case Web3Env.MAINNET:
        return MAINNET_CHAIN_IDS;
      case Web3Env.TESTNET:
        return TESTNET_CHAIN_IDS;
      case Web3Env.LOCALHOST:
      default:
        return LOCALHOST_CHAIN_IDS;
    }
  }

  public async calculateGasPrice(chainId: number): Promise<bigint> {
    const signer = this.getSigner(chainId);
    const multiplier = this.configService.get<number>(
      ConfigNames.GAS_PRICE_MULTIPLIER,
      1,
    );
    const gasPrice = (await signer.provider?.getFeeData())?.gasPrice;
    if (gasPrice) {
      return gasPrice * BigInt(multiplier);
    }
    throw new Error(ErrorWeb3.GasPriceError);
  }

  public getOperatorAddress(): string {
    return Object.values(this.signers)[0].address;
  }
}
