import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class KycProcedureStartResponse {
  @ApiProperty({ name: 'url' })
  @IsUrl()
  public url: string;
}
