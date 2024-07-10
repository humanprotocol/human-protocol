import { IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EscrowDto } from './escrow.dto';
import { LeaderDto } from './leader.dto';
import { WalletDto } from './wallet.dto';

export class DetailsDto {
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
