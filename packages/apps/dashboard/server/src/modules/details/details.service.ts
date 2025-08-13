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
  OrderDirection,
  KVStoreUtils,
  IOperatorsFilter,
  StakingClient,
  WorkerUtils,
} from '@human-protocol/sdk';

import { WalletDto } from './dto/wallet.dto';
import { EscrowDto, EscrowPaginationDto } from './dto/escrow.dto';
import { OperatorDto } from './dto/operator.dto';
import { TransactionPaginationDto } from './dto/transaction.dto';
import { EnvironmentConfigService } from '../../common/config/env-config.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { HMToken__factory } from '@human-protocol/core/typechain-types';
import { ethers } from 'ethers';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { OperatorsOrderBy } from '../../common/enums/operator';
import { ReputationLevel } from '../../common/enums/reputation';
import {
  MAX_LEADERS_COUNT,
  MIN_STAKED_AMOUNT,
  REPUTATION_PLACEHOLDER,
} from '../../common/constants/operator';
import { GetOperatorsPaginationOptions } from 'src/common/types';
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
  ): Promise<WalletDto | EscrowDto | OperatorDto> {
    const escrowData = await EscrowUtils.getEscrow(chainId, address);
    if (escrowData) {
      const escrowDto: EscrowDto = plainToInstance(EscrowDto, escrowData, {
        excludeExtraneousValues: true,
      });
      return escrowDto;
    }
    const network = this.networkConfig.networks.find(
      (network) => network.chainId === chainId,
    );
    if (!network) throw new BadRequestException('Invalid chainId provided');
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    const stakingClient = await StakingClient.build(provider);
    const stakingData = await stakingClient.getStakerInfo(address);

    const operatorData = await OperatorUtils.getOperator(chainId, address);
    if (operatorData) {
      const operatorDto: OperatorDto = plainToInstance(
        OperatorDto,
        operatorData,
        {
          excludeExtraneousValues: true,
        },
      );

      operatorDto.chainId = chainId;
      operatorDto.balance = await this.getHmtBalance(chainId, address);
      operatorDto.stakedAmount = ethers.formatEther(stakingData.stakedAmount);
      operatorDto.lockedAmount = ethers.formatEther(stakingData.lockedAmount);
      operatorDto.withdrawnAmount = ethers.formatEther(
        stakingData.withdrawableAmount,
      );

      const { reputation } = await this.fetchOperatorReputation(
        chainId,
        address,
        operatorDto.role,
      );
      operatorDto.reputation = reputation;

      return operatorDto;
    }

    const workerData = await WorkerUtils.getWorker(chainId, address);

    const walletDto: WalletDto = plainToInstance(WalletDto, {
      chainId,
      address,
      balance: await this.getHmtBalance(chainId, address),
      stakedAmount: ethers.formatEther(stakingData.stakedAmount),
      lockedAmount: ethers.formatEther(stakingData.lockedAmount),
      withdrawableAmount: ethers.formatEther(stakingData.withdrawableAmount),
      reputation: (await this.fetchOperatorReputation(chainId, address))
        .reputation,
      totalHMTAmountReceived: ethers.formatEther(
        workerData?.totalHMTAmountReceived || 0,
      ),
      payoutCount: workerData?.payoutCount || 0,
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

  public async getOperators(
    chainId: ChainId,
    { orderBy, orderDirection, first }: GetOperatorsPaginationOptions = {},
  ): Promise<OperatorDto[]> {
    const filter = this.createOperatorsFilter(
      chainId,
      orderBy,
      orderDirection,
      first,
    );

    const [rawOperators, reputations] = await Promise.all([
      OperatorUtils.getOperators(filter),
      this.fetchReputations(
        chainId,
        orderBy,
        orderDirection,
        orderBy === OperatorsOrderBy.REPUTATION ? filter.first : undefined,
      ),
    ]);

    const operators = rawOperators
      .filter((operator) => operator.role)
      .map((operator) =>
        plainToInstance(OperatorDto, operator, {
          excludeExtraneousValues: true,
        }),
      );

    const operatorsWithReputation = this.assignReputationsToOperators(
      operators,
      reputations,
    );

    if (orderBy === OperatorsOrderBy.REPUTATION) {
      return this.sortOperatorsByReputation(
        operatorsWithReputation,
        orderDirection,
        first,
      );
    }

    return operatorsWithReputation;
  }

  private createOperatorsFilter(
    chainId: ChainId,
    orderBy: OperatorsOrderBy,
    orderDirection: OrderDirection,
    first?: number,
  ): IOperatorsFilter {
    const operatorsFilter: IOperatorsFilter = {
      chainId,
      minStakedAmount: MIN_STAKED_AMOUNT,
      roles: [
        Role.JobLauncher,
        Role.ExchangeOracle,
        Role.RecordingOracle,
        Role.ReputationOracle,
      ],
    };

    if (orderBy === OperatorsOrderBy.REPUTATION) {
      operatorsFilter.first = MAX_LEADERS_COUNT;
    } else {
      Object.assign(operatorsFilter, {
        orderBy,
        orderDirection,
        first,
      });
    }

    return operatorsFilter;
  }

  private async fetchOperatorReputation(
    chainId: ChainId,
    address: string,
    role?: string,
  ): Promise<{ address: string; reputation: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ level: string }[]>(
          `${this.configService.reputationSource}/reputation`,
          {
            params: {
              chain_id: chainId,
              address,
              roles: role
                ? [role]
                : [
                    Role.JobLauncher,
                    Role.ExchangeOracle,
                    Role.RecordingOracle,
                    Role.ReputationOracle,
                  ],
            },
          },
        ),
      );

      let reputation = REPUTATION_PLACEHOLDER;
      if (response.data.length) {
        reputation = response.data[0].level;
      }
      return { address, reputation };
    } catch (error) {
      this.logger.error('Error fetching reputation:', error);
      return { address, reputation: REPUTATION_PLACEHOLDER };
    }
  }

  private async fetchReputations(
    chainId: ChainId,
    orderBy?: OperatorsOrderBy,
    orderDirection?: OrderDirection,
    first?: number,
  ): Promise<{ address: string; level: string }[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.reputationSource}/reputation`,
          {
            params: {
              chain_id: chainId,
              roles: [
                Role.JobLauncher,
                Role.ExchangeOracle,
                Role.RecordingOracle,
                Role.ReputationOracle,
              ],
              ...(orderBy &&
                orderBy === OperatorsOrderBy.REPUTATION && {
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

  private assignReputationsToOperators(
    operators: OperatorDto[],
    reputations: { address: string; level: string }[],
  ): OperatorDto[] {
    const reputationMap = new Map(
      reputations.map((rep) => [rep.address.toLowerCase(), rep.level]),
    );

    operators.forEach((operator) => {
      const reputation = reputationMap.get(operator.address.toLowerCase());
      operator.reputation = reputation || ReputationLevel.LOW;
    });

    return operators;
  }

  private sortOperatorsByReputation(
    operators: OperatorDto[],
    orderDirection: OrderDirection,
    first?: number,
  ): OperatorDto[] {
    const reputationOrder = {
      [ReputationLevel.LOW]: 1,
      [ReputationLevel.MEDIUM]: 2,
      [ReputationLevel.HIGH]: 3,
    };

    const sortedOperators = operators.sort((a, b) => {
      const reputationA = reputationOrder[a.reputation || ReputationLevel.LOW];
      const reputationB = reputationOrder[b.reputation || ReputationLevel.LOW];

      if (orderDirection === OrderDirection.ASC) {
        return reputationA - reputationB;
      } else {
        return reputationB - reputationA;
      }
    });

    if (first) {
      return sortedOperators.slice(0, first);
    }

    return sortedOperators;
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
