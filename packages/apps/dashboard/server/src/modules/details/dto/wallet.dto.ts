import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';
import { type ChainId, ProductionChainId } from '../../../common/constants';

export class WalletDto {
  @ApiProperty({ example: ProductionChainId.POLYGON_MAINNET })
  public chainId: ChainId;

  @ApiProperty({ example: '0xb794f5ea0ba39494ce839613fffba74279579268' })
  @IsString()
  public address: string;

  @ApiProperty({ example: '0.07007358932392' })
  @IsString()
  public balance: string;

  @ApiProperty({ example: '0.07007358932392' })
  @Transform(({ value }) => value?.toString())
  @IsString()
  public lockedAmount: string;

  @ApiProperty({ example: '0.07007358932392' })
  @Transform(({ value }) => value?.toString())
  @IsString()
  public withdrawableAmount: string;

  @ApiProperty({ example: 'High' })
  @Transform(({ value }) => value?.toString())
  @IsString()
  public reputation: string;

  @ApiProperty({ example: '2414.07007358932392' })
  @Transform(({ value }) => value?.toString())
  @IsString()
  public totalHMTAmountReceived?: string;

  @ApiProperty({ example: 1234 })
  @IsNumber()
  public payoutCount?: number;
}
