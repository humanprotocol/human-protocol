import { ChainId } from '@human-protocol/sdk';
import { ApiProperty } from '@nestjs/swagger';
import { AbuseStatus } from './constants';
import { IsChainId } from '../../common/validators';
import { IsEthereumAddress, IsString } from 'class-validator';

export class ReportAbuseDto {
  @ApiProperty({ name: 'chain_id' })
  @IsChainId()
  chainId: ChainId;

  @ApiProperty({ name: 'escrow_address' })
  @IsEthereumAddress()
  escrowAddress: string;
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

export class SlackInteractionDto {
  @ApiProperty({
    description: 'The Slack interaction payload as a stringified JSON object',
    example:
      '{"type":"interactive_message","callback_id":"123","actions":[{"value":"ACCEPTED"}]}',
  })
  @IsString()
  payload: string;
}
