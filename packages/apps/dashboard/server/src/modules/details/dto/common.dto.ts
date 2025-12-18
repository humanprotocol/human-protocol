import { ApiProperty } from '@nestjs/swagger';
import { IsChainId } from '../../../common/validators';
import { type ChainId, ChainIds } from '../../../common/constants';

export class ChainIdDto {
  @ApiProperty({ enum: ChainIds })
  @IsChainId()
  public chainId: ChainId;
}
