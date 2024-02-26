import { ApiProperty } from '@nestjs/swagger';
import { ChainId } from '@human-protocol/sdk';
import { IsEnum, IsString, IsUrl } from 'class-validator';

import { IsValidEthereumAddress } from '../../common/validators';
import { SolutionError } from '../../common/enums/job';
import { EventType } from '../../common/enums/webhook';

export class JobSolutionsRequestDto {
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

  @ApiProperty({ name: 'solutions_url' })
  @IsString()
  @IsUrl()
  public solutionsUrl: string;
}

export class SaveSolutionsDto {
  public url: string;
  public hash: string;
}

export class WebhookBody {
  escrowAddress: string;
  chainId: ChainId;
  eventType: EventType;
  eventData?: EventData[];
}

export class EventData {
  assigneeId: string;
  reason?: SolutionError;
}
