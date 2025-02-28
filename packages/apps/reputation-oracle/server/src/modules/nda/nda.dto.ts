import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

export class NDASignatureDto {
  @ApiProperty({ name: 'url' })
  @IsString()
  @IsUrl()
  public url: string;
}
