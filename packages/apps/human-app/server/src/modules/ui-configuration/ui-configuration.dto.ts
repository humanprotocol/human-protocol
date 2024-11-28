import { ChainId } from '@human-protocol/sdk';
import { ApiProperty } from '@nestjs/swagger';

export class UiConfigResponseDto {
  @ApiProperty({
    type: [Number],
    description: 'Chain ids enabled for the application',
    enum: ChainId,
    enumName: 'ChainId',
  })
  chainIdsEnabled: ChainId[];
}
