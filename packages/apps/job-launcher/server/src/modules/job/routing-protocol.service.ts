import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ChainId, NETWORKS, Role } from '@human-protocol/sdk';
import { Web3Service } from '../web3/web3.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { hashString } from '../../common/utils';
import { ErrorRoutingProtocol } from '../../common/constants/errors';
import { ControlledError } from '../../common/errors/controlled';

interface OracleOrder {
  [chainId: number]: {
    [reputationOracle: string]: {
      [oracleType: string]: {
        [jobType: string]: string[];
      };
    };
  };
}

interface OracleIndex {
  [chainId: number]: {
    [reputationOracle: string]: {
      [oracleType: string]: {
        [jobType: string]: number;
      };
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
  private oracleIndexes: OracleIndex = {};

  constructor(
    public readonly web3Service: Web3Service,
    public readonly web3ConfigService: Web3ConfigService,
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
            [Role.ExchangeOracle]: {},
            [Role.RecordingOracle]: {},
          };
          return oracleAcc;
        },
        {} as {
          [reputationOracle: string]: {
            [oracleType: string]: { [jobType: string]: string[] };
          };
        },
      );
      return acc;
    }, {} as OracleOrder);

    this.oracleIndexes = this.chains.reduce((acc: OracleIndex, chainId) => {
      acc[chainId] = this.reputationOracles.reduce(
        (oracleAcc, reputationOracle) => {
          oracleAcc[reputationOracle] = {
            [Role.ExchangeOracle]: {},
            [Role.RecordingOracle]: {},
          };
          return oracleAcc;
        },
        {} as {
          [reputationOracle: string]: {
            [oracleType: string]: { [jobType: string]: number };
          };
        },
      );
      return acc;
    }, {} as OracleIndex);
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

  public selectOracleFromAvailable(
    availableOracles: any[],
    oracleType: string,
    chainId: ChainId,
    reputationOracle: string,
    jobType: string,
  ): string {
    const oraclesOfType = availableOracles
      .filter((oracle) => oracle.role === oracleType)
      .map((oracle) => oracle.address);

    if (!oraclesOfType.length) return '';

    const latestOraclesHash = hashString(JSON.stringify(availableOracles));

    if (
      !this.oracleOrder[chainId][reputationOracle][oracleType][jobType] ||
      this.oraclesHash !== latestOraclesHash
    ) {
      this.oraclesHash = latestOraclesHash;
      const shuffledOracles = this.shuffleArray(oraclesOfType);
      this.oracleOrder[chainId][reputationOracle][oracleType][jobType] =
        shuffledOracles;
      this.oracleIndexes[chainId][reputationOracle][oracleType][jobType] = 0;
    }

    const orderedOracles =
      this.oracleOrder[chainId][reputationOracle][oracleType][jobType];
    const currentIndex =
      this.oracleIndexes[chainId][reputationOracle][oracleType][jobType] || 0;
    const selectedOracle = orderedOracles[currentIndex];

    this.oracleIndexes[chainId][reputationOracle][oracleType][jobType] =
      (currentIndex + 1) % orderedOracles.length;

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
    const availableOracles = await this.web3Service.findAvailableOracles(
      chainId,
      jobType,
      reputationOracle,
    );

    const exchangeOracle = this.selectOracleFromAvailable(
      availableOracles,
      Role.ExchangeOracle,
      chainId,
      reputationOracle,
      jobType,
    );
    const recordingOracle = this.selectOracleFromAvailable(
      availableOracles,
      Role.RecordingOracle,
      chainId,
      reputationOracle,
      jobType,
    );

    return { reputationOracle, exchangeOracle, recordingOracle };
  }

  public async validateOracles(
    chainId: ChainId,
    jobType: string,
    reputationOracle: string,
    exchangeOracle?: string | null,
    recordingOracle?: string | null,
  ) {
    const reputationOracles = this.web3ConfigService.reputationOracles
      .split(',')
      .map((address) => address.trim());

    if (!reputationOracles.includes(reputationOracle)) {
      throw new ControlledError(
        ErrorRoutingProtocol.ReputationOracleNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const availableOracles = await this.web3Service.findAvailableOracles(
      chainId,
      jobType,
      reputationOracle,
    );

    if (
      exchangeOracle &&
      !this.isOracleAvailable(
        availableOracles,
        exchangeOracle,
        Role.ExchangeOracle,
      )
    ) {
      throw new ControlledError(
        ErrorRoutingProtocol.ExchangeOracleNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    if (
      recordingOracle &&
      !this.isOracleAvailable(
        availableOracles,
        recordingOracle,
        Role.RecordingOracle,
      )
    ) {
      throw new ControlledError(
        ErrorRoutingProtocol.RecordingOracleNotFound,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  private isOracleAvailable(
    availableOracles: any[],
    oracle: string,
    role: string,
  ): boolean {
    return availableOracles.some(
      (o) =>
        o.address.toLowerCase() === oracle.toLowerCase() && o.role === role,
    );
  }
}
