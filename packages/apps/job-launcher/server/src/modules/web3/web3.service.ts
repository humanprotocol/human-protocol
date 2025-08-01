import { ChainId, OperatorUtils, Role } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { Wallet, ethers } from 'ethers';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ErrorWeb3 } from '../../common/constants/errors';
import { ConflictError, ValidationError } from '../../common/errors';
import { AvailableOraclesDto, OracleDataDto } from './web3.dto';
import logger from '../../logger';

@Injectable()
export class Web3Service {
  private readonly logger = logger.child({ context: Web3Service.name });
  private signers: { [key: number]: Wallet } = {};
  public readonly signerAddress: string;

  constructor(
    public readonly web3ConfigService: Web3ConfigService,
    public readonly networkConfigService: NetworkConfigService,
  ) {
    const privateKey = this.web3ConfigService.privateKey;

    if (!this.networkConfigService.networks.length) {
      throw new Error(ErrorWeb3.NoValidNetworks);
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
      throw new ValidationError(ErrorWeb3.InvalidChainId);
    }
  }

  public async calculateGasPrice(chainId: number): Promise<bigint> {
    const signer = this.getSigner(chainId);
    const multiplier = this.web3ConfigService.gasPriceMultiplier;

    const gasPrice = (await signer.provider?.getFeeData())?.gasPrice;
    if (gasPrice) {
      return gasPrice * BigInt(multiplier);
    }
    throw new ConflictError(ErrorWeb3.GasPriceError);
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
      this.logger.error('Error processing chainId', {
        chainId,
        jobType,
        address,
        error,
      });
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
    const operator = await OperatorUtils.getOperator(
      chainId,
      this.getOperatorAddress(),
    );

    if (!operator || !operator.reputationNetworks) {
      this.logger.error('Operator or reputation networks not found for chain', {
        chainId,
        jobType,
      });
      return [];
    }

    const matchingOracles = await Promise.all(
      operator.reputationNetworks.map(async (address) => {
        try {
          const networkOperator = await OperatorUtils.getOperator(
            chainId,
            address,
          );

          return networkOperator?.jobTypes &&
            this.matchesJobType(networkOperator.jobTypes, jobType)
            ? networkOperator.address
            : null;
        } catch (error) {
          this.logger.error('Failed to fetch operator for address', {
            chainId,
            address,
            jobType,
            error,
          });
          return null;
        }
      }),
    );

    return matchingOracles.filter(Boolean) as string[];
  }
}
