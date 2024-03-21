import { ChainId } from '@human-protocol/sdk';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsObject, IsString } from 'class-validator';
import { IsValidEthereumAddress } from '../../common/validators';
import { EventType } from '../../common/enums/webhook';

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
    name: 'event_data',
  })
  @IsObject()
  public eventData?: EventData;
}
