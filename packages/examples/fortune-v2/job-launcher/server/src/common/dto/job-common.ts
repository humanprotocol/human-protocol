import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsPositive, IsString, IsUrl } from "class-validator";
import { JobRequestType } from "../decorators";

export interface IJobCommonDto {
  networkId?: string;
  dataUrl?: string;
  data?: string;
  datasetLength?: number;
  manifestHash?: string;
  labels?: string[];
  annotationsPerImage?: number;
  requesterDescription?: string;
  requesterAccuracyTarget?: number;
  price?: number;
  requestType?: JobRequestType;
  tokenAddress?: string;
  escrowAddress?: string;
}

export class JobCommonDto implements IJobCommonDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  public networkId: string;

  @ApiPropertyOptional()
  @IsUrl()
  public dataUrl: string;

  @ApiPropertyOptional()
  @IsString()
  public data: string;

  @ApiPropertyOptional()
  public datasetLength: number;

  @ApiPropertyOptional()
  public annotationsPerImage: number;

  @ApiPropertyOptional()
  @IsString()
  public manifestHash: string;

  @ApiPropertyOptional()
  public labels: string[];

  @ApiPropertyOptional()
  @IsString()
  public requesterDescription: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  public requesterAccuracyTarget: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  public price: number;

  @ApiPropertyOptional()
  @IsEnum(JobRequestType)
  public requestType: JobRequestType;

  @ApiPropertyOptional()
  @IsString()
  public tokenAddress: string;

  @ApiPropertyOptional()
  @IsString()
  public escrowAddress: string;
}
