import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

import { IPaginationDto, PaginationDto } from "./pagination";

export interface ISearchDto extends IPaginationDto {
  query: string;
}

export class SearchDto extends PaginationDto implements ISearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public query: string;
}
