import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export interface IPaginationDto {
  skip: number;
  take: number;
}

export class PaginationDto implements IPaginationDto {
  @ApiPropertyOptional({
    type: Number,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  public skip = 0;

  @ApiPropertyOptional({
    type: Number,
    default: 25,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  public take = 25;
}
