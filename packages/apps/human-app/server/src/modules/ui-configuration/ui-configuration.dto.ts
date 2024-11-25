import { ApiProperty } from '@nestjs/swagger';

export class UiConfigResponseDto {
  @ApiProperty({
    type: [String],
    description: 'Chain ids enabled for the application',
  })
  chainIdsEnabled: string[];
}
