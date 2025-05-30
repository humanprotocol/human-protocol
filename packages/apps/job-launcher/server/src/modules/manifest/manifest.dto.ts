import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsArray,
  IsEthereumAddress,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsEnumCaseInsensitive } from '../../common/decorators';
import {
  JobCaptchaRequestType,
  JobCaptchaShapeType,
  JobRequestType,
} from '../../common/enums/job';
import {
  FortuneJobType,
  CvatJobType,
  AudinoJobType,
} from '../../common/enums/job';
import { Type } from 'class-transformer';

export class FortuneManifestDto {
  @ApiProperty({ name: 'submissions_required' })
  @IsNumber()
  @IsPositive()
  public submissionsRequired: number;

  @ApiProperty({ name: 'requester_title' })
  @IsString()
  public requesterTitle: string;

  @ApiProperty({ name: 'requester_description' })
  @IsString()
  public requesterDescription: string;

  @ApiProperty({ name: 'fund_amount' })
  @IsNumber()
  @IsPositive()
  public fundAmount: number;

  @ApiProperty({ enum: FortuneJobType, name: 'request_type' })
  @IsEnumCaseInsensitive(FortuneJobType)
  public requestType: FortuneJobType;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  public qualifications?: string[];
}

class CvatData {
  @IsUrl()
  public data_url: string;

  @IsUrl()
  @IsOptional()
  public points_url?: string;

  @IsUrl()
  @IsOptional()
  public boxes_url?: string;
}

export class Label {
  @ApiProperty()
  @IsString()
  public name: string;

  @ApiPropertyOptional()
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  public nodes?: string[];

  @ApiPropertyOptional()
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  public joints?: string[];
}

class Annotation {
  @IsArray()
  @ValidateNested()
  @Type(() => Label)
  public labels: Label[];

  @IsString()
  public description: string;

  @IsString()
  public user_guide: string;

  @IsEnumCaseInsensitive(CvatJobType)
  public type: CvatJobType;

  @IsNumber()
  @IsPositive()
  public job_size: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  public qualifications?: string[];
}

class Validation {
  @IsNumber()
  @IsPositive()
  public min_quality: number;

  @IsNumber()
  @IsPositive()
  public val_size: number;

  @IsString()
  public gt_url: string;
}

export class CvatManifestDto {
  @IsObject()
  @ValidateNested()
  @Type(() => CvatData)
  public data: CvatData;

  @IsObject()
  @ValidateNested()
  @Type(() => Annotation)
  public annotation: Annotation;

  @IsObject()
  @ValidateNested()
  @Type(() => Validation)
  public validation: Validation;

  @IsString()
  public job_bounty: string;
}

class AudinoData {
  @IsUrl()
  public data_url: string;
}

class AudinoAnnotation {
  @IsArray()
  public labels: Array<{ name: string }>;

  @IsString()
  public description: string;

  @IsString()
  @IsUrl()
  public user_guide: string;

  @Equals(AudinoJobType.AUDIO_TRANSCRIPTION)
  public type: AudinoJobType.AUDIO_TRANSCRIPTION;

  @IsNumber()
  @IsPositive()
  public segment_duration: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  public qualifications?: string[];
}

class AudinoValidation {
  @IsNumber()
  @IsPositive()
  public min_quality: number;

  @IsString()
  @IsUrl()
  public gt_url: string;
}

export class AudinoManifestDto {
  @IsObject()
  @ValidateNested()
  @Type(() => AudinoData)
  public data: AudinoData;

  @IsObject()
  @ValidateNested()
  @Type(() => AudinoAnnotation)
  public annotation: AudinoAnnotation;

  @IsObject()
  @ValidateNested()
  @Type(() => AudinoValidation)
  public validation: AudinoValidation;
}

export class RestrictedAudience {
  @IsObject()
  @IsOptional()
  sitekey?: Record<string, { score: number }>[];

  @IsObject()
  @IsOptional()
  lang?: Record<string, { score: number }>[];

  @IsObject()
  @IsOptional()
  browser?: Record<string, { score: number }>[];

  @IsObject()
  @IsOptional()
  country?: Record<string, { score: number }>[];
}

class RequesterRestrictedAnswer {
  @IsString()
  @IsOptional()
  en?: string;

  @IsUrl()
  @IsOptional()
  answer_example_uri?: string;
}

class RequestConfig {
  @IsEnumCaseInsensitive(JobCaptchaShapeType)
  @IsOptional()
  shape_type?: JobCaptchaShapeType;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  min_shapes_per_image?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  max_shapes_per_image?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  min_points?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  max_points?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  minimum_selection_area_per_shape?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  multiple_choice_max_choices?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  multiple_choice_min_choices?: number;

  @IsString()
  @IsOptional()
  answer_type?: string;

  @IsOptional()
  overlap_threshold?: any;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  max_length?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  min_length?: number;
}

export class HCaptchaManifestDto {
  @IsString()
  job_mode: string;

  @IsEnumCaseInsensitive(JobCaptchaRequestType)
  request_type: JobCaptchaRequestType;

  @IsObject()
  @ValidateNested()
  @Type(() => RequestConfig)
  request_config: RequestConfig;

  @IsNumber()
  requester_accuracy_target: number;

  @IsNumber()
  requester_max_repeats: number;

  @IsNumber()
  requester_min_repeats: number;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  requester_question_example?: string[];

  @IsObject()
  requester_question: Record<string, string>;

  @IsUrl()
  taskdata_uri: string;

  @IsNumber()
  job_total_tasks: number;

  @IsNumber()
  task_bid_price: number;

  @IsUrl()
  @IsOptional()
  groundtruth_uri?: string;

  public_results: boolean;

  @IsNumber()
  oracle_stake: number;

  @IsString()
  repo_uri: string;

  @IsString()
  ro_uri: string;

  @IsObject()
  @ValidateNested()
  @Type(() => RestrictedAudience)
  restricted_audience: RestrictedAudience;

  @IsObject()
  @ValidateNested()
  @Type(() => RequesterRestrictedAnswer)
  requester_restricted_answer_set: RequesterRestrictedAnswer;

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => TaskData)
  taskdata?: TaskData[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  public qualifications?: string[];
}

class DatapointText {
  @IsString()
  en: string;
}

class TaskData {
  @IsString()
  task_key: string;

  @IsOptional()
  @IsString()
  datapoint_uri?: string;

  @IsString()
  datapoint_hash: string;

  @IsObject()
  @IsOptional()
  datapoint_text?: DatapointText;
}

export class ManifestDetails {
  @ApiProperty({ description: 'Chain ID', name: 'chain_id' })
  @IsNumber()
  @Min(1)
  public chainId: number;

  @ApiProperty({ description: 'Title (optional)' })
  @IsOptional()
  @IsString()
  public title?: string;

  @ApiProperty({ description: 'Description' })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  public description?: string;

  @ApiProperty({
    description: 'Submissions required',
    name: 'submissions_required',
  })
  @IsNumber()
  public submissionsRequired: number;

  @ApiProperty({
    description: 'Ethereum address of the token',
    name: 'token_address',
  })
  @IsEthereumAddress()
  public tokenAddress: string;

  @ApiProperty({ description: 'Amount of funds', name: 'fund_amount' })
  @IsNumber()
  public fundAmount: number;

  @ApiProperty({
    description: 'Ethereum address of the requester',
    name: 'requester_address',
  })
  @IsEthereumAddress()
  public requesterAddress: string;

  @ApiProperty({ description: 'Request type', name: 'request_type' })
  @IsString()
  public requestType: JobRequestType;

  @ApiProperty({
    description: 'Address of the exchange oracle (optional)',
    name: 'exchange_oracle_address',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsEthereumAddress()
  public exchangeOracleAddress?: string;

  @ApiProperty({
    description: 'Address of the recording oracle (optional)',
    name: 'recording_oracle_address',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsEthereumAddress()
  public recordingOracleAddress?: string;

  @ApiProperty({
    description: 'Address of the reputation oracle (optional)',
    name: 'reputation_oracle_address',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsEthereumAddress()
  public reputationOracleAddress?: string;
}

export type ManifestDto =
  | FortuneManifestDto
  | CvatManifestDto
  | HCaptchaManifestDto
  | AudinoManifestDto;
