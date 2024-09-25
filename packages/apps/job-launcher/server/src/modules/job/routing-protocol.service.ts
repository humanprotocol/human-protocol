import { Injectable, Logger } from '@nestjs/common';
import { ChainId, NETWORKS, Role } from '@human-protocol/sdk';
import { Web3Service } from '../web3/web3.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { hashString } from '../../common/utils';

interface OracleOrder {
  [chainId: number]: {
    [reputationOracle: string]: {
      [role: string]: string[];
    };
  };
}

@Injectable()
export class RoutingProtocolService {
  public readonly logger = new Logger(RoutingProtocolService.name);
  private readonly chains: ChainId[];
  private readonly reputationOracles: string[];
  private readonly chainPriorityOrder: number[];
  private readonly reputationOraclePriorityOrder: number[];
  private chainCurrentIndex = 0;
  private reputationOracleIndex = 0;
  private oraclesHash: string | null = null;
  private oracleOrder: OracleOrder = {};

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

    this.oracleOrder = this.chains.reduce((acc: OracleOrder, chainId) => {
      acc[chainId] = this.reputationOracles.reduce(
        (oracleAcc, reputationOracle) => {
          oracleAcc[reputationOracle] = {
            [Role.ExchangeOracle]: [],
            [Role.RecordingOracle]: [],
          };
          return oracleAcc;
        },
        {} as { [reputationOracle: string]: { [role: string]: string[] } },
      );
      return acc;
    }, {} as OracleOrder);
  }

  private shuffleArray<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
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

  public async selectOracleFromAvailable(
    availableOracles: any[],
    oracleType: string,
    chainId: ChainId,
    reputationOracle: string,
  ): Promise<string | null> {
    const oraclesOfType = availableOracles
      .filter((oracle) => oracle.role === oracleType)
      .map((oracle) => oracle.address);

    if (!oraclesOfType.length) {
      return null;
    }

    const latestOraclesHash = hashString(JSON.stringify(oraclesOfType));
    // Check if we need to shuffle and store the new order
    if (this.oraclesHash !== latestOraclesHash) {
      this.oraclesHash = latestOraclesHash;
      const shuffledOracles = this.shuffleArray(oraclesOfType);
      this.oracleOrder[chainId][reputationOracle][oracleType] = shuffledOracles;
    }

    const orderedOracles =
      this.oracleOrder[chainId][reputationOracle][oracleType];

    const currentIndex = this.reputationOracleIndex % orderedOracles.length;
    const selectedOracle = orderedOracles[currentIndex];

    this.reputationOracleIndex =
      (this.reputationOracleIndex + 1) % orderedOracles.length;

    return selectedOracle;
  }

  public async selectOracles(
    chainId: ChainId,
    jobType: string,
  ): Promise<{
    reputationOracle: string;
    exchangeOracle: string | null;
    recordingOracle: string | null;
  }> {
    const reputationOracle = this.selectReputationOracle();
    const availableOracles = await this.web3Service.findAvailableOracles(
      chainId,
      jobType,
      reputationOracle,
    );

    const exchangeOracle = await this.selectOracleFromAvailable(
      availableOracles,
      Role.ExchangeOracle,
      chainId,
      reputationOracle,
    );
    const recordingOracle = await this.selectOracleFromAvailable(
      availableOracles,
      Role.RecordingOracle,
      chainId,
      reputationOracle,
    );

    return { reputationOracle, exchangeOracle, recordingOracle };
  }
}
