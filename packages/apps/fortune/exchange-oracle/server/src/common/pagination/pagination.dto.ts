import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  Max,
  Min,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SortDirection } from '../enums/collection';
import { IsEnumCaseInsensitive } from '../decorators/enums';

export class PageDto<T> {
  @ApiProperty()
  readonly page: number;

  @ApiProperty()
  readonly pageSize: number;

  @ApiProperty()
  readonly totalPages: number;

  @ApiProperty()
  readonly totalResults: number;

  @IsArray()
  @ApiProperty({ isArray: true })
  readonly results: T[];

  constructor(
    page: number,
    pageSize: number,
    totalResults: number,
    results: T[],
  ) {
    this.page = page;
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(totalResults / pageSize) || 0;
    this.totalResults = totalResults;
    this.results = results;
  }
}

export abstract class PageOptionsDto {
  @ApiPropertyOptional({
    minimum: 0,
    default: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  page?: number = 0;

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
  pageSize?: number = 5;

  @ApiPropertyOptional({ enum: SortDirection, default: SortDirection.ASC })
  @IsEnumCaseInsensitive(SortDirection)
  @IsOptional()
  sort?: SortDirection = SortDirection.ASC;

  @IsOptional()
  abstract sortField?: any;

  get skip(): number {
    return this.page! * this.pageSize!;
  }
}
