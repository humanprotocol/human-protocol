import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Wallet, providers } from 'ethers';
import { ConfigNames, networkMap } from '../../common/config';
import { Web3Env } from '../../common/enums/web3';
import { MAINNET_CHAIN_IDS, TESTNET_CHAIN_IDS } from '../../common/constants';
import { ErrorWeb3 } from '../../common/constants/errors';
import { ChainId } from '@human-protocol/sdk';

@Injectable()
export class Web3Service {
  private signers: { [key: number]: Wallet } = {};
  public readonly logger = new Logger(Web3Service.name);

  constructor(private readonly configService: ConfigService) {
    const privateKey = this.configService.get(ConfigNames.WEB3_PRIVATE_KEY);
    for (const networkKey of Object.keys(networkMap)) {
      const network = networkMap[networkKey];
      const provider = new providers.JsonRpcProvider(network.rpcUrl);
      this.signers[network.chainId] = new Wallet(privateKey, provider);
    }
  }

  public getSigner(chainId: number): Wallet {
    this.validateChainId(chainId);
    return this.signers[chainId];
  }

  public validateChainId(chainId: number): void {
    const currentWeb3Env = this.configService.get(ConfigNames.WEB3_ENV);
    const validChainIds = this.getValidChains();

    if (!validChainIds.includes(chainId)) {
      const errorType =
        currentWeb3Env === Web3Env.MAINNET
          ? ErrorWeb3.InvalidMainnetChainId
          : ErrorWeb3.InvalidTestnetChainId;
      this.logger.log(errorType, Web3Service.name);
      throw new BadRequestException(errorType);
    }
  }

  public getValidChains(): ChainId[] {
    const currentWeb3Env = this.configService.get(ConfigNames.WEB3_ENV);
    const validChainIds =
      currentWeb3Env === Web3Env.MAINNET
        ? MAINNET_CHAIN_IDS
        : TESTNET_CHAIN_IDS;

    return validChainIds;
  }
}
