import { ApiProperty } from '@nestjs/swagger';
import { ChainId } from '@human-protocol/sdk';
import { IsEnum, IsString, IsUrl } from 'class-validator';

import { IsValidEthereumAddress } from '@/common/validators';
import { SolutionError } from '@/common/enums/job';
import { EventType } from '@/common/enums/webhook';

export class JobSolutionsRequestDto {
  @ApiProperty()
  @IsString()
  @IsValidEthereumAddress()
  public escrowAddress: string;

  @ApiProperty({
    enum: ChainId,
  })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  @IsUrl()
  public solutionsUrl: string;
}

export class SaveSolutionsDto {
  public url: string;
  public hash: string;
}

export class WebhookBody {
  escrow_address: string;
  chain_id: ChainId;
  event_type: EventType;
  event_data?: EventData[];
}

export class EventData {
  assignee_id: string;
  reason?: SolutionError;
}
