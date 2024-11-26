import { ChainId } from '@human-protocol/sdk';
import { ApiProperty } from '@nestjs/swagger';

export class UiConfigResponseDto {
  @ApiProperty({
    type: [ChainId],
    description: 'Chain ids enabled for the application',
  })
  chainIdsEnabled: ChainId[];
}
