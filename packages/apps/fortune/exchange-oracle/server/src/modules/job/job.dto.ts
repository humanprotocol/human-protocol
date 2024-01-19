import { ApiProperty } from '@nestjs/swagger';
import { ChainId } from '@human-protocol/sdk';
import { IsEnum, IsString, IsArray } from 'class-validator';
import { IsValidEthereumAddress } from '../../common/validators';
import { EventType } from '../../common/enums/webhook';

export class ManifestDto {
  requesterTitle: string;
  requesterDescription: string;
  submissionsRequired: number;
  fundAmount: number;
}

export class JobDetailsDto {
  escrowAddress: string;
  chainId: number;
  manifest: ManifestDto;
}

export class SolveJobDto {
  @ApiProperty({ name: 'escrow_address' })
  @IsString()
  @IsValidEthereumAddress()
  public escrowAddress: string;

  @ApiProperty({
    enum: ChainId,
    name: 'chain_id',
  })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty({ name: 'worker_address' })
  @IsString()
  @IsValidEthereumAddress()
  public workerAddress: string;

  @ApiProperty()
  @IsString()
  public solution: string;
}

export class EventData {
  @ApiProperty({ name: 'assignee_id' })
  @IsString()
  assigneeId?: string;

  @ApiProperty()
  @IsString()
  reason?: string;
}
export class WebhookDto {
  @ApiProperty({
    enum: ChainId,
    name: 'chain_id',
  })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty({ name: 'escrow_address' })
  @IsString()
  @IsValidEthereumAddress()
  public escrowAddress: string;

  @ApiProperty({
    enum: EventType,
    name: 'event_type',
  })
  @IsEnum(EventType)
  public eventType: EventType;

  @ApiProperty({
    type: [EventData],
    name: 'event_data',
  })
  @IsArray()
  public eventData?: EventData[];
}
