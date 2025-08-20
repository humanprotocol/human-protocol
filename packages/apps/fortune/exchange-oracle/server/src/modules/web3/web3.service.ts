import { ChainId } from '@human-protocol/sdk';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Wallet, ethers } from 'ethers';

import logger from '../../logger';
import { Web3Env } from '../../common/enums/web3';
import {
  LOCALHOST_CHAIN_IDS,
  MAINNET_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
} from '../../common/constant';
import { ErrorWeb3 } from '../../common/constant/errors';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { NetworkConfigService } from '../../common/config/network-config.service';

@Injectable()
export class Web3Service {
  private readonly logger = logger.child({ context: Web3Service.name });

  private signers: { [key: number]: Wallet } = {};
  readonly signerAddress: string;
  readonly currentWeb3Env: string;

  constructor(
    private readonly web3ConfigService: Web3ConfigService,
    readonly networkConfigService: NetworkConfigService,
  ) {
    const privateKey = this.web3ConfigService.privateKey;
    const validChains = this.getValidChains();
    const validNetworks = networkConfigService.networks.filter((network) =>
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
      this.logger.error(ErrorWeb3.InvalidChainId, { chainId });
      throw new BadRequestException(ErrorWeb3.InvalidChainId);
    }
  }

  public getValidChains(): ChainId[] {
    switch (this.web3ConfigService.env) {
      case Web3Env.MAINNET:
        return MAINNET_CHAIN_IDS;
      case Web3Env.TESTNET:
        return TESTNET_CHAIN_IDS;
      case Web3Env.LOCALHOST:
      default:
        return LOCALHOST_CHAIN_IDS;
    }
  }
}
