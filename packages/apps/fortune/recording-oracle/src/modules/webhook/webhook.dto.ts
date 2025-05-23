import { ChainId } from '@human-protocol/sdk';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEthereumAddress,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { EventType } from '../../common/enums/webhook';
import { IsEnumCaseInsensitive } from '@/common/decorators';

export class AssignmentRejection {
  @ApiProperty({ name: 'assignee_id' })
  @IsString()
  assigneeId?: string;

  @ApiProperty()
  @IsString()
  reason?: string;
}

export class RejectionEventData {
  @ApiProperty({
    type: [AssignmentRejection],
  })
  @IsArray()
  public assignments: AssignmentRejection[];
}

export class SolutionEventData {
  @ApiProperty({ name: 'solutions_url' })
  @IsString()
  solutionsUrl: string;
}

export type EventData = RejectionEventData | SolutionEventData;

export class WebhookDto {
  @ApiProperty({
    enum: ChainId,
    name: 'chain_id',
  })
  @IsEnumCaseInsensitive(ChainId)
  public chainId: ChainId;

  @ApiProperty({ name: 'escrow_address' })
  @IsEthereumAddress()
  public escrowAddress: string;

  @ApiProperty({
    enum: EventType,
    name: 'event_type',
  })
  @IsEnumCaseInsensitive(EventType)
  public eventType: EventType;

  @ApiProperty({
    name: 'event_data',
  })
  @IsObject()
  @IsOptional()
  public eventData?: EventData;
}
