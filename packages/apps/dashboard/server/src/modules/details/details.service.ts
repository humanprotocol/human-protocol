import { plainToInstance } from 'class-transformer';

import { Injectable, Logger } from '@nestjs/common';
import { ChainId, EscrowUtils, OperatorUtils } from '@human-protocol/sdk';

import { WalletDto } from './dto/wallet.dto';
import { EscrowDto } from './dto/escrow.dto';
import { LeaderDto } from './dto/leader.dto';

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
    const walletDto: WalletDto = {
      chainId,
      address,
      // TODO: Balance fetching
      balance: '0.01',
    };
    return walletDto;
  }
}
