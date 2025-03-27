import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class NDASignatureDto {
  @ApiProperty({ name: 'url' })
  @IsUrl()
  url: string;
}
