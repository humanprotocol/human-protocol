import { plainToInstance } from 'class-transformer';

import { Injectable, Logger } from '@nestjs/common';
import {
  ChainId,
  EscrowUtils,
  TransactionUtils,
  OperatorUtils,
} from '@human-protocol/sdk';

import { WalletDto } from './dto/wallet.dto';
import { EscrowDto } from './dto/escrow.dto';
import { LeaderDto } from './dto/leader.dto';
import { TransactionPaginationDto } from './dto/transaction.dto';

@Injectable()
export class DetailsService {
  private readonly logger = new Logger(DetailsService.name);
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

      leaderDto.address = address;
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
}
