import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Wallet, ethers } from 'ethers';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ErrorWeb3 } from '../../common/constants/errors';
import { ControlledError } from '../../common/errors/controlled';
import { AvailableOraclesDto, OracleDataDto } from './web3.dto';
import { ChainId, OperatorUtils, Role } from '@human-protocol/sdk';

@Injectable()
export class Web3Service {
  public readonly logger = new Logger(Web3Service.name);
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

  public async getAvailableOracles(
    chainId: ChainId,
    jobType: string,
    reputationOracleAddress: string,
  ): Promise<AvailableOraclesDto> {
    const availableOracles = await this.findAvailableOracles(
      chainId,
      jobType,
      reputationOracleAddress,
    );

    const exchangeOracles = availableOracles
      .filter((oracle) => oracle.role === Role.ExchangeOracle)
      .map((oracle) => oracle.address);

    const recordingOracles = availableOracles
      .filter((oracle) => oracle.role === Role.RecordingOracle)
      .map((oracle) => oracle.address);

    return {
      exchangeOracles: exchangeOracles,
      recordingOracles: recordingOracles,
    };
  }

  public async findAvailableOracles(
    chainId: ChainId,
    jobType: string,
    address: string,
  ): Promise<OracleDataDto[]> {
    try {
      const receivedOracles = await OperatorUtils.getReputationNetworkOperators(
        chainId,
        address,
      );

      const filteredOracles = this.filterOracles(receivedOracles, jobType);

      return filteredOracles;
    } catch (error) {
      this.logger.error(`Error processing chainId ${chainId}:`, error);
    }
    return [];
  }

  public filterOracles(
    foundOracles: OracleDataDto[] | undefined,
    jobType: string,
  ) {
    if (foundOracles && foundOracles.length > 0) {
      const filteredOracles = foundOracles.filter((oracle) => {
        if (!oracle.url || oracle.url === null) {
          return false;
        }
        return true;
      });
      if (jobType) {
        return filteredOracles.filter((oracle) =>
          oracle.jobTypes && oracle.jobTypes.length > 0
            ? this.matchesJobType(oracle.jobTypes, jobType)
            : false,
        );
      }
      return filteredOracles;
    }
    return [];
  }

  public matchesJobType(oracleJobTypes: string[], requiredJobType: string) {
    return oracleJobTypes.some(
      (job) => job.toLowerCase() === requiredJobType.toLowerCase(),
    );
  }

  public async getReputationOraclesByJobType(
    chainId: ChainId,
    jobType: string,
  ): Promise<string[]> {
    const leader = await OperatorUtils.getLeader(
      chainId,
      this.getOperatorAddress(),
    );

    if (!leader || !leader.reputationNetworks) {
      this.logger.error(
        `Leader or reputation networks not found for chain ${chainId}.`,
      );
      return [];
    }

    const matchingOracles = await Promise.all(
      leader.reputationNetworks.map(async (address) => {
        try {
          const networkLeader = await OperatorUtils.getLeader(chainId, address);
          console.log(1111, networkLeader);

          return networkLeader?.jobTypes &&
            this.matchesJobType(networkLeader.jobTypes, jobType)
            ? networkLeader.address
            : null;
        } catch (error) {
          this.logger.error(
            `Failed to fetch leader for address ${address} on chain ${chainId}:`,
            error,
          );
          return null;
        }
      }),
    );

    return matchingOracles.filter(Boolean) as string[];
  }
}
