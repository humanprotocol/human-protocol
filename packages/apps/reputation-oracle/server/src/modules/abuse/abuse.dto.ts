import { ChainId } from '@human-protocol/sdk';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { AbuseStatus } from '../../common/enums/abuse';

export class ReportAbuseDto {
  @ApiProperty({ name: 'chain_id' })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty({ name: 'escrow_address' })
  @IsString()
  public escrowAddress: string;
}

export class AbuseResponseDto {
  @ApiProperty({ description: 'Unique identifier of the abuse entity' })
  id: number;

  @ApiProperty({ description: 'Escrow address associated with the abuse' })
  escrowAddress: string;

  @ApiProperty({ description: 'Chain ID where the abuse occurred' })
  chainId: ChainId;

  @ApiProperty({ description: 'Current status of the abuse report' })
  status: AbuseStatus;
}
