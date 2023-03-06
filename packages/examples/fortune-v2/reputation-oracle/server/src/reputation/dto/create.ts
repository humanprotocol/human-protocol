import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsPositive, IsString, IsUrl, Matches } from "class-validator";

import { IJobCreateDto } from "../interfaces";

export class JobCreateDto implements IJobCreateDto {
  @ApiProperty()
  @IsUrl()
  @Matches(/(s3-|s3\.)?(.*)\.amazonaws\.com/, {
    message: "URL must be in the correct S3 bucket format",
  })
  public dataUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @Matches(/(s3-|s3\.)?(.*)\.amazonaws\.com/, {
    message: "URL must be in the correct S3 bucket file format",
  })
  public groundTruthFileUrl: string;

  @ApiProperty()
  @IsNumber()
  public annotationsPerImage: number;

  @ApiProperty()
  @IsArray()
  public labels: string[];

  @ApiProperty()
  @IsString()
  public requesterDescription: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public requesterAccuracyTarget: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  public fee: number;
}
