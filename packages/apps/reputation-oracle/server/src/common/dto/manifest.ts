import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsPositive,
  IsString,
} from 'class-validator';
import { JobRequestType } from '../enums';

export class CvatData {
  @IsString()
  data_url: string;
}

export class Label {
  @IsString()
  name: string;
}

export class Annotation {
  @IsArray()
  labels: Label[];

  @IsString()
  description: string;

  @IsEnum(JobRequestType)
  type: JobRequestType;

  @IsNumber()
  @IsPositive()
  job_size: number;

  @IsNumber()
  @IsPositive()
  max_time: number;
}

export class Validation {
  @IsNumber()
  @IsPositive()
  min_quality: number;

  @IsNumber()
  @IsPositive()
  val_size: number;

  @IsString()
  gt_url: string;
}

export class CvatManifestDto {
  @IsObject()
  data: CvatData;

  @IsObject()
  annotation: Annotation;

  @IsObject()
  validation: Validation;

  @IsString()
  job_bounty: string;
}

export class FortuneManifestDto {
  @IsNumber()
  @IsPositive()
  submissionsRequired: number;

  @IsString()
  requesterTitle: string;

  @IsString()
  requesterDescription: string;

  @IsNumber()
  @IsPositive()
  fundAmount: number;

  @IsEnum(JobRequestType)
  requestType: JobRequestType;
}
