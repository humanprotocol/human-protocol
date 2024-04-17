import { ChainId } from '@human-protocol/sdk';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export class ReportAbuseDto {
  @ApiProperty({ name: 'chain_id' })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty({ name: 'escrow_address' })
  @IsString()
  public escrowAddress: string;
}
