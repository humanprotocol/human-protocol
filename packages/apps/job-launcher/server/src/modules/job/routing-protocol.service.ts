import { Injectable, Logger } from '@nestjs/common';
import { ChainId, NETWORKS, Role } from '@human-protocol/sdk';
import { Web3Service } from '../web3/web3.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { mapJobType } from 'src/common/utils';

@Injectable()
export class RoutingProtocolService {
  public readonly logger = new Logger(RoutingProtocolService.name);
  private readonly chains: ChainId[];
  private readonly reputationOracles: string[];
  private readonly chainPriorityOrder: number[];
  private readonly reputationOraclePriorityOrder: number[];
  private oracleIndex: {
    [chainId: number]: {
      [reputationOracle: string]: { [role: string]: number };
    };
  };
  private chainCurrentIndex = 0;
  private reputationOracleIndex = 0;

  constructor(
    private readonly web3Service: Web3Service,
    private readonly web3ConfigService: Web3ConfigService,
  ) {
    this.chains = Object.keys(NETWORKS).map((chainId) => +chainId);
    this.reputationOracles = this.web3ConfigService.reputationOracles
      .split(',')
      .map((address) => address.trim());

    this.chainPriorityOrder = this.shuffleArray(this.chains);
    this.reputationOraclePriorityOrder = this.shuffleArray(
      this.reputationOracles.map((_, i) => i),
    );
    this.oracleIndex = this.initializeOracleIndex();
  }

  private shuffleArray<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
  }

  private initializeOracleIndex(): {
    [chainId: number]: {
      [reputationOracle: string]: { [role: string]: number };
    };
  } {
    const indexMap: {
      [chainId: number]: {
        [reputationOracle: string]: { [role: string]: number };
      };
    } = {};

    this.chains.forEach((chainId) => {
      indexMap[chainId] = {};

      this.reputationOracles.forEach((reputationOracle) => {
        indexMap[chainId][reputationOracle] = {
          [Role.ExchangeOracle]: 0,
          [Role.RecordingOracle]: 0,
        };
      });
    });

    return indexMap;
  }

  public selectNetwork(): ChainId {
    const chainId =
      this.chains[this.chainPriorityOrder[this.chainCurrentIndex]];
    this.chainCurrentIndex = (this.chainCurrentIndex + 1) % this.chains.length;
    return chainId;
  }

  public selectReputationOracle(): string {
    const reputationOracle =
      this.reputationOracles[
        this.reputationOraclePriorityOrder[this.reputationOracleIndex]
      ];

    this.reputationOracleIndex =
      (this.reputationOracleIndex + 1) % this.reputationOracles.length;
    return reputationOracle;
  }

  public async selectOracle(
    chainId: ChainId,
    reputationOracle: string,
    oracleType: string,
    jobType: string,
  ): Promise<string> {
    const availableOracles = await this.web3Service.findAvailableOracles(
      chainId,
      jobType,
      reputationOracle,
    );
    const oraclesOfType = availableOracles
      .filter((oracle) => oracle.role === oracleType)
      .map((oracle) => oracle.address);

    const oracleIdx = this.oracleIndex[chainId][reputationOracle][oracleType];
    const selectedOracle = oraclesOfType[oracleIdx];

    this.oracleIndex[chainId][reputationOracle][oracleType] =
      (oracleIdx + 1) % oraclesOfType.length;

    this.logger.log(
      `Selected ${oracleType} oracle: ${selectedOracle} for chainId ${chainId}`,
    );
    return selectedOracle;
  }

  public async selectOracles(
    chainId: ChainId,
    jobType: string,
  ): Promise<{
    reputationOracle: string;
    exchangeOracle: string;
    recordingOracle: string;
  }> {
    const reputationOracle = this.selectReputationOracle();
    const exchangeOracle = await this.selectOracle(
      chainId,
      reputationOracle,
      Role.ExchangeOracle,
      jobType,
    );
    const recordingOracle = await this.selectOracle(
      chainId,
      reputationOracle,
      Role.RecordingOracle,
      jobType,
    );

    return { reputationOracle, exchangeOracle, recordingOracle };
  }
}
