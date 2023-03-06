import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsEnum } from "class-validator";
import { ISearchDto, SearchDto } from "./search";

export enum SortDirection {
  ASC = "ASC",
  DESC = "DESC",
}

export interface ISortDto<T> extends ISearchDto {
  sort: SortDirection;
  sortBy: keyof T;
}

export class SortDto<T> extends SearchDto implements ISortDto<T> {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public sortBy: keyof T;

  @ApiPropertyOptional({
    enum: SortDirection,
  })
  @IsOptional()
  @IsEnum(SortDirection)
  public sort: SortDirection;
}
