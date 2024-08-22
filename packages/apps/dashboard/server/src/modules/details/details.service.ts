import { plainToInstance } from 'class-transformer';
import { MainnetsId } from '../../common/utils/constants';
import { Injectable, Logger } from '@nestjs/common';
import {
  ChainId,
  EscrowUtils,
  TransactionUtils,
  OperatorUtils,
  IEscrowsFilter,
  Role,
} from '@human-protocol/sdk';

import { WalletDto } from './dto/wallet.dto';
import { EscrowDto, EscrowPaginationDto } from './dto/escrow.dto';
import { LeaderDto } from './dto/leader.dto';
import { TransactionPaginationDto } from './dto/transaction.dto';
import { EnvironmentConfigService } from '../../common/config/env-config.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DetailsService {
  private readonly logger = new Logger(DetailsService.name);
  constructor(
    private readonly configService: EnvironmentConfigService,
    private readonly httpService: HttpService,
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
      // TODO: Balance fetching
      leaderDto.balance = '0.01';

      return leaderDto;
    }
    const walletDto: WalletDto = plainToInstance(WalletDto, {
      chainId,
      address,
      // TODO: Balance fetching
      balance: '0.01',
    });

    return walletDto;
  }

  public async getTransactions(
    chainId: ChainId,
    address: string,
    first: number,
    skip: number,
  ): Promise<TransactionPaginationDto[]> {
    // TODO: Switch to fetch all transactions related to this wallet address once SDK is changed
    const transactions = await TransactionUtils.getTransactions({
      chainId,
      fromAddress: address,
      first,
      skip,
    });
    const result = transactions.map((transaction) => {
      const transcationPaginationObject: TransactionPaginationDto =
        plainToInstance(TransactionPaginationDto, transaction, {
          excludeExtraneousValues: true,
        });
      return transcationPaginationObject;
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

  public async getBestLeadersByRole(chainId?: ChainId): Promise<LeaderDto[]> {
    const chainIds = !chainId
      ? (Object.values(MainnetsId).filter(
          (value) => typeof value === 'number',
        ) as number[])
      : [chainId];

    const leadersByRole: { [role: string]: LeaderDto } = {};

    for (const id of chainIds) {
      const leadersData = await OperatorUtils.getLeaders({ chainId: id });

      for (const leaderData of leadersData) {
        const leaderDto: LeaderDto = plainToInstance(LeaderDto, leaderData, {
          excludeExtraneousValues: true,
        });
        leaderDto.chainId = id;

        const role = leaderDto.role;

        if (Object.values(Role).includes(role)) {
          if (
            !leadersByRole[role] ||
            BigInt(leaderDto.amountStaked) >
              BigInt(leadersByRole[role].amountStaked)
          ) {
            leadersByRole[role] = leaderDto;
          }
        }
      }
    }

    const reputations = await this.fetchReputations();
    this.assignReputationsToLeaders(Object.values(leadersByRole), reputations);

    return Object.values(leadersByRole);
  }

  public async getAllLeaders(chainId?: ChainId): Promise<LeaderDto[]> {
    const chainIds = !chainId
      ? (Object.values(MainnetsId).filter(
          (value) => typeof value === 'number',
        ) as number[])
      : [chainId];

    const allLeaders: LeaderDto[] = [];

    for (const id of chainIds) {
      const leadersData = await OperatorUtils.getLeaders({ chainId: id });

      for (const leaderData of leadersData) {
        const leaderDto: LeaderDto = plainToInstance(LeaderDto, leaderData, {
          excludeExtraneousValues: true,
        });
        leaderDto.chainId = id;

        if (leaderDto.role) {
          allLeaders.push(leaderDto);
        }
      }
    }

    const reputations = await this.fetchReputations();
    this.assignReputationsToLeaders(allLeaders, reputations);

    return allLeaders;
  }

  private async fetchReputations(): Promise<
    { address: string; reputation: string }[]
  > {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          this.configService.reputationSource + '/reputation',
          {
            params: {
              chain_id: ChainId.POLYGON,
              roles: [
                'JOB_LAUNCHER',
                'EXCHANGE_ORACLE',
                'RECORDING_ORACLE',
                'REPUTATION_ORACLE',
              ],
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Error fetching reputations:', error);
      return [];
    }
  }

  private assignReputationsToLeaders(
    leaders: LeaderDto[],
    reputations: { address: string; reputation: string }[],
  ) {
    const reputationMap = new Map(
      reputations.map((rep) => [rep.address.toLowerCase(), rep.reputation]),
    );
    leaders.forEach((leader) => {
      const reputation = reputationMap.get(leader.address.toLowerCase());
      if (reputation) {
        leader.reputation = reputation;
      }
    });
  }
}
