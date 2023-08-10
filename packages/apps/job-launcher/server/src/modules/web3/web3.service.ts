import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Wallet, providers } from 'ethers';
import { ConfigNames, networkMap } from '../../common/config';
import { Web3Env } from '../../common/enums/web3';
import { MAINNET_CHAIN_IDS, TESTNET_CHAIN_IDS } from '../../common/constants';
import { ErrorWeb3 } from '../../common/constants/errors';

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

  getSigner(chainId: number): Wallet {
    if (Web3Env.MAINNET === this.configService.get(ConfigNames.WEB3_ENV) && !MAINNET_CHAIN_IDS.includes(chainId)) {
      this.logger.log(ErrorWeb3.InvalidMainnetChainId, Web3Service.name);
      throw new BadRequestException(ErrorWeb3.InvalidMainnetChainId);
    } else if (Web3Env.TESTNET === this.configService.get(ConfigNames.WEB3_ENV) && !TESTNET_CHAIN_IDS.includes(chainId)) {
      this.logger.log(ErrorWeb3.InvalidTestnetChainId, Web3Service.name);
      throw new BadRequestException(ErrorWeb3.InvalidTestnetChainId);
    }

    return this.signers[chainId];
  }
}