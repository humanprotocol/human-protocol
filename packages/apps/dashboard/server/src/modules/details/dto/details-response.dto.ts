import { IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty()
  public first: number;

  @ApiProperty()
  public skip: number;

  @ApiProperty()
  @IsArray()
  public results: EscrowPaginationDto[] | TransactionPaginationDto[];
}
