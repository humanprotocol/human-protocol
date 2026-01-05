import { IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { EscrowDto, EscrowPaginationDto } from './escrow.dto';
import { TransactionPaginationDto } from './transaction.dto';
import { OperatorDto } from './operator.dto';
import { WalletDto } from './wallet.dto';
import { ChainId, ProductionChainId } from '../../../common/constants';

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
  public operator?: OperatorDto;
}

export class DetailsPaginationResponseDto {
  @ApiProperty({ example: '0xb794f5ea0ba39494ce839613fffba74279579268' })
  public address: string;

  @ApiProperty({ example: ProductionChainId.POLYGON_MAINNET })
  public chainId: ChainId;

  @ApiProperty({ example: 10 })
  public first: number;

  @ApiProperty({ example: 0 })
  public skip: number;

  @ApiProperty()
  @IsArray()
  public results: EscrowPaginationDto[] | TransactionPaginationDto[];
}

export class KVStoreDataDto {
  @ApiProperty({ example: 'key' })
  public key: string;

  @ApiProperty({ example: 'value' })
  public value: string;
}
