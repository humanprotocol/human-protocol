import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ChainId } from '@human-protocol/sdk';

export class WalletDto {
  @ApiProperty({ example: ChainId.POLYGON_AMOY })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty({ example: '0xb794f5ea0ba39494ce839613fffba74279579268' })
  @IsString()
  public address: string;

  @ApiProperty({ example: '0.07007358932392' })
  @IsString()
  public balance: string;
}
