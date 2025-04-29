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

  @ApiProperty({ enum: JobRequestType, name: 'request_type' })
  @IsEnumCaseInsensitive(JobRequestType)
  public requestType: JobRequestType;

  @IsArray()
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
  @IsArray()
  @IsOptional()
  public nodes?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  public joints?: string[];
}

class Annotation {
  @IsArray()
  public labels: Label[];

  @IsString()
  public description: string;

  @IsString()
  public user_guide: string;

  @IsEnumCaseInsensitive(JobRequestType)
  public type: JobRequestType;

  @IsNumber()
  @IsPositive()
  public job_size: number;

  @IsArray()
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
  public data: CvatData;

  @IsObject()
  public annotation: Annotation;

  @IsObject()
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

  @Equals(JobRequestType.AUDIO_TRANSCRIPTION)
  public type: JobRequestType.AUDIO_TRANSCRIPTION;

  @IsNumber()
  @IsPositive()
  public segment_duration: number;

  @IsArray()
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
  public data: AudinoData;

  @IsObject()
  public annotation: AudinoAnnotation;

  @IsObject()
  public validation: AudinoValidation;

  @IsString()
  public job_bounty: string;
}

export class RestrictedAudience {
  @IsObject()
  sitekey?: Record<string, { score: number }>[];

  @IsObject()
  lang?: Record<string, { score: number }>[];

  @IsObject()
  browser?: Record<string, { score: number }>[];

  @IsObject()
  country?: Record<string, { score: number }>[];
}

class RequesterRestrictedAnswer {
  @IsString()
  en?: string;

  @IsUrl()
  answer_example_uri?: string;
}

class RequestConfig {
  @IsEnumCaseInsensitive(JobCaptchaShapeType)
  shape_type?: JobCaptchaShapeType;

  @IsNumber()
  @IsPositive()
  min_shapes_per_image?: number;

  @IsNumber()
  @IsPositive()
  max_shapes_per_image?: number;

  @IsNumber()
  @IsPositive()
  min_points?: number;

  @IsNumber()
  @IsPositive()
  max_points?: number;

  @IsNumber()
  @IsPositive()
  minimum_selection_area_per_shape?: number;

  @IsNumber()
  @IsPositive()
  multiple_choice_max_choices?: number;

  @IsNumber()
  @IsPositive()
  multiple_choice_min_choices?: number;

  @IsString()
  answer_type?: string;

  overlap_threshold?: any;

  @IsNumber()
  @IsPositive()
  max_length?: number;

  @IsNumber()
  @IsPositive()
  min_length?: number;
}

export class HCaptchaManifestDto {
  @IsString()
  job_mode: string;

  @IsEnumCaseInsensitive(JobCaptchaRequestType)
  request_type: JobCaptchaRequestType;

  @IsObject()
  @ValidateNested()
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
  restricted_audience: RestrictedAudience;

  @IsObject()
  @ValidateNested({ each: true })
  requester_restricted_answer_set: RequesterRestrictedAnswer;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  taskdata?: TaskData[];

  @IsArray()
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
  @IsEnumCaseInsensitive(JobRequestType)
  public requestType: JobRequestType;

  @ApiProperty({
    description: 'Address of the exchange oracle (optional)',
    name: 'exchange_oracle_address',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  public exchangeOracleAddress?: string;

  @ApiProperty({
    description: 'Address of the recording oracle (optional)',
    name: 'recording_oracle_address',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  public recordingOracleAddress?: string;

  @ApiProperty({
    description: 'Address of the reputation oracle (optional)',
    name: 'reputation_oracle_address',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  public reputationOracleAddress?: string;
}
