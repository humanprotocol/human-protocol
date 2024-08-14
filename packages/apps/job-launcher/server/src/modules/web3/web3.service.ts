import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Wallet, ethers } from 'ethers';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ErrorWeb3 } from '../../common/constants/errors';
import { ControlledError } from '../../common/errors/controlled';
import { AvailableOraclesDto, OracleDiscoveryDto } from './web3.dto';
import { ChainId, OperatorUtils, Role } from '@human-protocol/sdk';
import { JobRequestType } from 'src/common/enums/job';

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
    jobTypes: string[],
    reputationOracleAddress: string,
  ): Promise<AvailableOraclesDto> {
    console.log(0);
    const availableOracles = await this.findAvailableOracles(
      chainId,
      jobTypes,
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

  private async findAvailableOracles(
    chainId: ChainId,
    jobTypes: string[],
    address: string,
  ): Promise<OracleDiscoveryDto[]> {
    try {
      console.log(1000000);
      console.log(chainId, address);
      const receivedOracles = await OperatorUtils.getReputationNetworkOperators(
        chainId,
        address,
      );
      console.log(1111, receivedOracles);

      const filteredOracles = this.filterOracles(receivedOracles, jobTypes);

      return filteredOracles;
    } catch (error) {
      this.logger.error(`Error processing chainId ${chainId}:`, error);
    }
    return [];
  }

  private filterOracles(
    foundOracles: OracleDiscoveryDto[] | undefined,
    jobTypes: string[] | undefined,
  ) {
    if (foundOracles && foundOracles.length > 0) {
      const filteredOracles = foundOracles.filter((oracle) => {
        if (!oracle.url || oracle.url === null) {
          return false;
        }
        return true;
      });
      if (jobTypes && jobTypes.length > 0) {
        return filteredOracles.filter((oracle) =>
          oracle.jobTypes && oracle.jobTypes.length > 0
            ? this.areJobTypeSetsIntersect(oracle.jobTypes, jobTypes)
            : false,
        );
      }
      return filteredOracles;
    }
    return [];
  }

  private areJobTypeSetsIntersect(
    oracleJobTypes: string[],
    requiredJobTypes: string[],
  ) {
    console.log(222, requiredJobTypes);
    return oracleJobTypes.some((job) =>
      requiredJobTypes
        .map((requiredJob) => requiredJob.toLowerCase())
        .includes(job.toLowerCase()),
    );
  }
}
