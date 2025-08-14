import { ApiProperty } from '@nestjs/swagger';

export class PingResponseDto {
  @ApiProperty()
  node_env: string;

  @ApiProperty()
  version: string;
}
