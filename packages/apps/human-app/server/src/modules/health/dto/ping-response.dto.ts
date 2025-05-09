import { ApiProperty } from '@nestjs/swagger';

export class PingResponseDto {
  @ApiProperty()
  public gitHash: string;
}
