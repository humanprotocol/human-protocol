import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class KycProcedureStartResponse {
  @IsString()
  @ApiProperty({ example: 'string' })
  session_id: string;
}
