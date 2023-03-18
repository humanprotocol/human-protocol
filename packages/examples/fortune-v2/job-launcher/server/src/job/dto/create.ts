import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNumber, IsPositive, IsString, IsUrl, Matches } from "class-validator";
import { ChainId } from "../../common/constants/networks";

import { IJobFortuneCreateDto, IJobCvatCreateDto } from "../interfaces";

export class JobFortuneCreateDto implements IJobFortuneCreateDto {
  @ApiProperty({
    enum: ChainId,
  })
  @IsEnum(ChainId)
  public chainId: ChainId;
  
  @ApiProperty()
  @IsNumber()
  public fortunesRequired: number;

  @ApiProperty()
  @IsString()
  public requesterTitle: string;

  @ApiProperty()
  @IsString()
  public requesterDescription: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  public price: number;
}

export class JobCvatCreateDto implements IJobCvatCreateDto {
  @ApiProperty({
    enum: ChainId,
  })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsUrl()
  @Matches (/(s3-|s3\.)?(.*)\.amazonaws\.com/, {
    message:
      'URL must be in the correct S3 bucket format',
  })
  public dataUrl: string;

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
}