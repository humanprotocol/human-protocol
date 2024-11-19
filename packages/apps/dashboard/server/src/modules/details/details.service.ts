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
import { StatsService } from '../stats/stats.service';

@Injectable()
export class DetailsService {
  private readonly logger = new Logger(DetailsService.name);
  constructor(
    private readonly statsService: StatsService,
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
    // TODO: Switch to fetch all transactions related to this wallet address once SDK is changed
    const transactions = await TransactionUtils.getTransactions({
      chainId,
      fromAddress: address,
      toAddress: address,
      first,
      skip,
    });
    const result = transactions.map((transaction) => {
      const transcationPaginationObject: TransactionPaginationDto =
        plainToInstance(
          TransactionPaginationDto,
          { ...transaction, currentAddress: address },
          { excludeExtraneousValues: true },
        );
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
      ? await this.statsService.getAvailableNetworks()
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
      ? await this.statsService.getAvailableNetworks()
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

  private async fetchReputation(
    chainId: ChainId,
    address: string,
  ): Promise<{ address: string; reputation: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          this.configService.reputationSource + `/reputation/${address}`,
          {
            params: {
              chain_id: chainId,
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
