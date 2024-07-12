import { IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChainId } from '@human-protocol/sdk';

import { EscrowDto, EscrowPaginationDto } from './escrow.dto';
import { TransactionPaginationDto } from './transaction.dto';
import { LeaderDto } from './leader.dto';
import { WalletDto } from './wallet.dto';

export class DetailsResponseDto {
  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  public wallet?: WalletDto;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  public escrow?: EscrowDto;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  public leader?: LeaderDto;
}

export class DetailsPaginationResponseDto {
  @ApiProperty({ example: '0xb794f5ea0ba39494ce839613fffba74279579268' })
  public address: string;

  @ApiProperty({ example: ChainId.POLYGON_AMOY })
  public chainId: ChainId;

  @ApiProperty({ example: 10 })
  public first: number;

  @ApiProperty({ example: 0 })
  public skip: number;

  @ApiProperty()
  @IsArray()
  public results: EscrowPaginationDto[] | TransactionPaginationDto[];
}
