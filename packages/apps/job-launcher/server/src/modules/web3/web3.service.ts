import { HMToken__factory } from '@human-protocol/core/typechain-types';
import { ChainId, OperatorUtils, Role } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { NonceManager, Wallet, ethers } from 'ethers';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ErrorWeb3 } from '../../common/constants/errors';
import { ConflictError, ValidationError } from '../../common/errors';
import { IERC20Token } from '../../common/interfaces/web3';
import logger from '../../logger';
import { AvailableOraclesDto, OracleDataDto } from './web3.dto';

@Injectable()
export class Web3Service {
  private readonly logger = logger.child({ context: Web3Service.name });
  private signers: { [key: number]: NonceManager } = {};

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
      const baseWallet = new Wallet(privateKey, provider);
      this.signers[network.chainId] = new NonceManager(baseWallet);
    }
  }

  public getSigner(chainId: number): NonceManager {
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

  public async getOperatorAddress(): Promise<string> {
    return Object.values(this.signers)[0].getAddress();
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
      await this.getOperatorAddress(),
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

  public async ensureEscrowAllowance(
    chainId: number,
    token: IERC20Token,
    requiredAmount: bigint,
    spender: string,
  ): Promise<void> {
    const signer = this.getSigner(chainId);
    const erc20 = HMToken__factory.connect(token.address, signer);

    const currentAllowance = await erc20.allowance(
      await this.getOperatorAddress(),
      spender,
    );

    if (currentAllowance >= requiredAmount) {
      return;
    }

    const approveAmount =
      this.web3ConfigService.approveAmount === 0 ||
      this.web3ConfigService.approveAmount < requiredAmount
        ? requiredAmount
        : ethers.parseUnits(
            this.web3ConfigService.approveAmount.toString(),
            token.decimals,
          );

    const tx = await erc20.approve(spender, approveAmount);
    await tx.wait();
  }
}
