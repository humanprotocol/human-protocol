import { plainToInstance } from 'class-transformer';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  ChainId,
  EscrowUtils,
  TransactionUtils,
  OperatorUtils,
  IEscrowsFilter,
  Role,
  NETWORKS,
  ILeadersFilter,
  OrderDirection,
  KVStoreUtils,
  IKVStore,
} from '@human-protocol/sdk';

import { WalletDto } from './dto/wallet.dto';
import { EscrowDto, EscrowPaginationDto } from './dto/escrow.dto';
import { LeaderDto } from './dto/leader.dto';
import { TransactionPaginationDto } from './dto/transaction.dto';
import { EnvironmentConfigService } from '../../common/config/env-config.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { HMToken__factory } from '@human-protocol/core/typechain-types';
import { ethers } from 'ethers';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { OracleRole, SubgraphOracleRole } from '../../common/enums/roles';
import { LeadersOrderBy } from '../../common/enums/leader';
import { ReputationLevel } from '../../common/enums/reputation';
import {
  MAX_LEADERS_COUNT,
  MIN_AMOUNT_STAKED,
} from '../../common/constants/leader';
import { GetLeadersPaginationOptions } from 'src/common/types';
import { KVStoreDataDto } from './dto/details-response.dto';

@Injectable()
export class DetailsService {
  private readonly logger = new Logger(DetailsService.name);
  constructor(
    private readonly configService: EnvironmentConfigService,
    private readonly httpService: HttpService,
    private readonly networkConfig: NetworkConfigService,
  ) {}

  public async getDetails(
    chainId: ChainId,
    address: string,
  ): Promise<WalletDto | EscrowDto | LeaderDto> {
    const escrowData = await EscrowUtils.getEscrow(chainId, address);
    if (escrowData) {
      const escrowDto: EscrowDto = plainToInstance(EscrowDto, escrowData, {
        excludeExtraneousValues: true,
      });
      return escrowDto;
    }
    const leaderData = await OperatorUtils.getLeader(chainId, address);
    if (leaderData) {
      const leaderDto: LeaderDto = plainToInstance(LeaderDto, leaderData, {
        excludeExtraneousValues: true,
      });

      leaderDto.chainId = chainId;
      leaderDto.balance = await this.getHmtBalance(chainId, address);

      const { reputation } = await this.fetchReputation(chainId, address);
      leaderDto.reputation = reputation;

      return leaderDto;
    }
    const walletDto: WalletDto = plainToInstance(WalletDto, {
      chainId,
      address,
      balance: await this.getHmtBalance(chainId, address),
    });

    return walletDto;
  }

  private async getHmtBalance(chainId: ChainId, hmtAddress: string) {
    const network = this.networkConfig.networks.find(
      (network) => network.chainId === chainId,
    );
    if (!network) throw new BadRequestException('Invalid chainId provided');
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    const hmtContract = HMToken__factory.connect(
      NETWORKS[chainId].hmtAddress,
      provider,
    );
    return ethers.formatEther(await hmtContract.balanceOf(hmtAddress));
  }

  public async getTransactions(
    chainId: ChainId,
    address: string,
    first: number,
    skip: number,
  ): Promise<TransactionPaginationDto[]> {
    const transactions = await TransactionUtils.getTransactions({
      chainId,
      fromAddress: address,
      toAddress: address,
      first,
      skip,
    });
    const result = transactions.map((transaction) => {
      const transactionPaginationObject: TransactionPaginationDto =
        plainToInstance(
          TransactionPaginationDto,
          { ...transaction, currentAddress: address },
          { excludeExtraneousValues: true },
        );
      return transactionPaginationObject;
    });

    return result;
  }

  public async getEscrows(
    chainId: ChainId,
    role: string,
    address: string,
    first: number,
    skip: number,
  ): Promise<EscrowPaginationDto[]> {
    const filter: IEscrowsFilter = {
      chainId,
      first,
      skip,
    };

    switch (role) {
      case Role.JobLauncher:
        filter.launcher = address;
        break;
      case Role.ReputationOracle:
        filter.reputationOracle = address;
        break;
      case Role.RecordingOracle:
        filter.recordingOracle = address;
        break;
      case Role.ExchangeOracle:
        filter.exchangeOracle = address;
        break;
    }
    const escrows = await EscrowUtils.getEscrows(filter);
    const result = escrows.map((escrow) => {
      const escrowPaginationObject: EscrowPaginationDto = plainToInstance(
        EscrowPaginationDto,
        escrow,
        {
          excludeExtraneousValues: true,
        },
      );
      return escrowPaginationObject;
    });

    return result;
  }

  public async getLeaders(
    chainId: ChainId,
    { orderBy, orderDirection, first }: GetLeadersPaginationOptions = {},
  ): Promise<LeaderDto[]> {
    const filter = this.createLeadersFilter(
      chainId,
      orderBy,
      orderDirection,
      first,
    );

    const [rawLeaders, reputations] = await Promise.all([
      OperatorUtils.getLeaders(filter),
      this.fetchReputations(
        chainId,
        orderBy,
        orderDirection,
        orderBy === LeadersOrderBy.REPUTATION ? filter.first : undefined,
      ),
    ]);

    const leaders = rawLeaders
      .filter((leader) => leader.role)
      .map((leader) =>
        plainToInstance(LeaderDto, leader, { excludeExtraneousValues: true }),
      );

    const leadersWithReputation = this.assignReputationsToLeaders(
      leaders,
      reputations,
    );

    if (orderBy === LeadersOrderBy.REPUTATION) {
      return this.sortLeadersByReputation(
        leadersWithReputation,
        orderDirection,
        first,
      );
    }

    return leadersWithReputation;
  }

  private createLeadersFilter(
    chainId: ChainId,
    orderBy: LeadersOrderBy,
    orderDirection: OrderDirection,
    first?: number,
  ): ILeadersFilter {
    const leadersFilter: ILeadersFilter = {
      chainId,
      minAmountStaked: MIN_AMOUNT_STAKED,
      roles: [
        SubgraphOracleRole.JOB_LAUNCHER,
        SubgraphOracleRole.EXCHANGE_ORACLE,
        SubgraphOracleRole.RECORDING_ORACLE,
        SubgraphOracleRole.REPUTATION_ORACLE,
      ],
    };

    if (orderBy === LeadersOrderBy.REPUTATION) {
      leadersFilter.first = MAX_LEADERS_COUNT;
    } else {
      Object.assign(leadersFilter, {
        orderBy,
        orderDirection,
        first,
      });
    }

    return leadersFilter;
  }

  private async fetchReputation(
    chainId: ChainId,
    address: string,
  ): Promise<{ address: string; reputation: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.reputationSource}/reputation/${address}`,
          {
            params: {
              chain_id: chainId,
              roles: [
                OracleRole.JOB_LAUNCHER,
                OracleRole.EXCHANGE_ORACLE,
                OracleRole.RECORDING_ORACLE,
                OracleRole.REPUTATION_ORACLE,
              ],
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Error fetching reputation:', error);
      return { address, reputation: 'Not available' };
    }
  }

  private async fetchReputations(
    chainId: ChainId,
    orderBy?: LeadersOrderBy,
    orderDirection?: OrderDirection,
    first?: number,
  ): Promise<{ address: string; reputation: string }[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.reputationSource}/reputation`,
          {
            params: {
              chain_id: chainId,
              roles: [
                OracleRole.JOB_LAUNCHER,
                OracleRole.EXCHANGE_ORACLE,
                OracleRole.RECORDING_ORACLE,
                OracleRole.REPUTATION_ORACLE,
              ],
              ...(orderBy &&
                orderBy === LeadersOrderBy.REPUTATION && {
                  order_by: 'reputation_points',
                }),
              ...(orderDirection && { order_direction: orderDirection }),
              ...(first && { first }),
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error fetching reputations for chain id ${chainId}`,
        error,
      );
      return [];
    }
  }

  private assignReputationsToLeaders(
    leaders: LeaderDto[],
    reputations: { address: string; reputation: string }[],
  ): LeaderDto[] {
    const reputationMap = new Map(
      reputations.map((rep) => [rep.address.toLowerCase(), rep.reputation]),
    );

    leaders.forEach((leader) => {
      const reputation = reputationMap.get(leader.address.toLowerCase());
      leader.reputation = reputation || ReputationLevel.LOW;
    });

    return leaders;
  }

  private sortLeadersByReputation(
    leaders: LeaderDto[],
    orderDirection: OrderDirection,
    first?: number,
  ): LeaderDto[] {
    const reputationOrder = {
      [ReputationLevel.LOW]: 1,
      [ReputationLevel.MEDIUM]: 2,
      [ReputationLevel.HIGH]: 3,
    };

    const sortedLeaders = leaders.sort((a, b) => {
      const reputationA = reputationOrder[a.reputation || ReputationLevel.LOW];
      const reputationB = reputationOrder[b.reputation || ReputationLevel.LOW];

      if (orderDirection === OrderDirection.ASC) {
        return reputationA - reputationB;
      } else {
        return reputationB - reputationA;
      }
    });

    if (first) {
      return sortedLeaders.slice(0, first);
    }

    return sortedLeaders;
  }

  public async getKVStoreData(
    chainId: ChainId,
    address: string,
  ): Promise<KVStoreDataDto[]> {
    const kvStoreData = await KVStoreUtils.getKVStoreData(chainId, address);

    const data: KVStoreDataDto[] = kvStoreData.map((data: any) => {
      return plainToInstance(KVStoreDataDto, {
        key: data.key,
        value: data.value,
      });
    });

    return data;
  }
}
