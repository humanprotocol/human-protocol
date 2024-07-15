import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { SortOrder } from '../enums/global-common';
import { AutoMap } from '@automapper/classes';

export abstract class PageableDto {
  @AutoMap()
  @ApiPropertyOptional({
    minimum: 0,
    default: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  page?: number = 0;

  @AutoMap()
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 10,
    default: 5,
    name: 'page_size',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  page_size?: number = 5;

  @AutoMap()
  @ApiPropertyOptional({ enum: SortOrder })
  @IsEnum(SortOrder)
  @IsOptional()
  sort?: SortOrder = SortOrder.ASC;

  @IsOptional()
  abstract sort_field?: any;
}
export abstract class PageableParams {
  @AutoMap()
  page?: number;

  @AutoMap()
  pageSize?: number;

  @AutoMap()
  sort?: SortOrder;

  abstract sortField?: any;
}
export abstract class PageableData {
  @AutoMap()
  page?: number;

  @AutoMap()
  page_size?: number;

  @AutoMap()
  sort?: SortOrder;

  abstract sort_field?: any;
}
export abstract class PageableResponse {
  page: number;
  page_size: number;
  total_pages: number;
  total_results: number;
}
