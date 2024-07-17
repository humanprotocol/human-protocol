import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HmtPriceDto {
  @ApiProperty({ example: 0.123 })
  @IsString()
  public hmtPrice: number;
}
