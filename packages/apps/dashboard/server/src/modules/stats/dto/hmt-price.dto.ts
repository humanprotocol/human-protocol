import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HmtPriceDto {
  @ApiProperty({ example: 0.123 })
  @IsNumber()
  public hmtPrice: number;
}
