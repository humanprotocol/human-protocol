import { ChainId } from '@human-protocol/sdk';
import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsString, MaxLength } from 'class-validator';

import { IsChainId } from '@/common/validators';

import { AbuseStatus } from './constants';

export class ReportAbuseDto {
  @ApiProperty({ name: 'chain_id' })
  @IsChainId()
  chainId: ChainId;

  @ApiProperty({ name: 'escrow_address' })
  @IsEthereumAddress()
  escrowAddress: string;

  @ApiProperty({
    name: 'reason',
    required: true,
    description: 'Reason for the abuse report',
  })
  @IsString()
  @MaxLength(1000)
  reason: string;
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

  @ApiProperty({ description: 'Reason for the abuse report', required: true })
  reason: string;
}

export class SlackInteractionDto {
  @ApiProperty({
    description: 'The Slack interaction payload as a stringified JSON object',
    example:
      '{"type":"interactive_message","callback_id":"123","actions":[{"value":"ACCEPTED"}]}',
  })
  @IsString()
  payload: string;
}
