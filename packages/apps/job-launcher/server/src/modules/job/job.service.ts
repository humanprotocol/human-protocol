/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  ChainId,
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  NETWORKS,
  StorageParams,
  Encryption,
  KVStoreKeys,
  KVStoreUtils,
} from '@human-protocol/sdk';
import { v4 as uuidv4 } from 'uuid';
import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  ValidationError,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { ethers } from 'ethers';
import { AuthConfigService } from '../../common/config/auth-config.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { CvatConfigService } from '../../common/config/cvat-config.service';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import {
  ErrorBucket,
  ErrorEscrow,
  ErrorJob,
  ErrorQualification,
} from '../../common/constants/errors';
import {
  JobRequestType,
  JobStatus,
  JobCaptchaMode,
  JobCaptchaRequestType,
  JobCaptchaShapeType,
  EscrowFundToken,
} from '../../common/enums/job';
import { FiatCurrency } from '../../common/enums/payment';
import { parseUrl } from '../../common/utils';
import { add, div, mul, max } from '../../common/utils/decimal';
import { PaymentService } from '../payment/payment.service';
import { Web3Service } from '../web3/web3.service';
import {
  CvatManifestDto,
  EscrowCancelDto,
  FortuneFinalResultDto,
  FortuneManifestDto,
  JobCvatDto,
  JobDetailsDto,
  JobFortuneDto,
  JobListDto,
  HCaptchaManifestDto,
  JobCaptchaAdvancedDto,
  JobCaptchaDto,
  RestrictedAudience,
  CreateJob,
  JobQuickLaunchDto,
  CvatDataDto,
  StorageDataDto,
  GetJobsDto,
  JobAudinoDto,
  AudinoManifestDto,
} from './job.dto';
import { JobEntity } from './job.entity';
import { JobRepository } from './job.repository';
import {
  CANCEL_JOB_STATUSES,
  HCAPTCHA_BOUNDING_BOX_MAX_POINTS,
  HCAPTCHA_BOUNDING_BOX_MIN_POINTS,
  HCAPTCHA_IMMO_MAX_LENGTH,
  HCAPTCHA_IMMO_MIN_LENGTH,
  HCAPTCHA_LANDMARK_MAX_POINTS,
  HCAPTCHA_LANDMARK_MIN_POINTS,
  HCAPTCHA_MAX_SHAPES_PER_IMAGE,
  HCAPTCHA_MINIMUM_SELECTION_AREA_PER_SHAPE,
  HCAPTCHA_MIN_SHAPES_PER_IMAGE,
  HCAPTCHA_NOT_PRESENTED_LABEL,
  HCAPTCHA_ORACLE_STAKE,
  HCAPTCHA_POLYGON_MAX_POINTS,
  HCAPTCHA_POLYGON_MIN_POINTS,
} from '../../common/constants';
import { EventType, OracleType } from '../../common/enums/webhook';
import {
  HMToken,
  HMToken__factory,
} from '@human-protocol/core/typechain-types';
import Decimal from 'decimal.js';
import { StorageService } from '../storage/storage.service';
import {
  generateBucketUrl,
  listObjectsInBucket,
} from '../../common/utils/storage';
import { WebhookDataDto } from '../webhook/webhook.dto';
import {
  ManifestAction,
  EscrowAction,
  OracleAction,
  OracleAddresses,
  RequestAction,
  CvatCalculateJobBounty,
  CvatImageData,
  CvatAnnotationData,
  GenerateUrls,
} from './job.interface';
import { WebhookEntity } from '../webhook/webhook.entity';
import { WebhookRepository } from '../webhook/webhook.repository';
import { ControlledError } from '../../common/errors/controlled';
import { RateService } from '../rate/rate.service';
import { PageDto } from '../../common/pagination/pagination.dto';
import { CronJobType } from '../../common/enums/cron-job';
import { CronJobRepository } from '../cron-job/cron-job.repository';
import { ModuleRef } from '@nestjs/core';
import { QualificationService } from '../qualification/qualification.service';
import { WhitelistService } from '../whitelist/whitelist.service';
import { UserEntity } from '../user/user.entity';
import { RoutingProtocolService } from '../routing-protocol/routing-protocol.service';
import { TOKEN_ADDRESSES } from '../../common/constants/tokens';
import { getTokenDecimals } from '../../common/utils/tokens';

@Injectable()
export class JobService {
  public readonly logger = new Logger(JobService.name);
  public readonly storageParams: StorageParams;
  public readonly bucket: string;
  private cronJobRepository: CronJobRepository;
  constructor(
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    private readonly jobRepository: JobRepository,
    private readonly webhookRepository: WebhookRepository,
    private readonly paymentService: PaymentService,
    private readonly serverConfigService: ServerConfigService,
    private readonly authConfigService: AuthConfigService,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly cvatConfigService: CvatConfigService,
    private readonly pgpConfigService: PGPConfigService,
    private readonly routingProtocolService: RoutingProtocolService,
    private readonly storageService: StorageService,
    private readonly rateService: RateService,
    private readonly whitelistService: WhitelistService,
    private moduleRef: ModuleRef,
    @Inject(Encryption) private readonly encryption: Encryption,
    private readonly qualificationService: QualificationService,
  ) {}

  onModuleInit() {
    this.cronJobRepository = this.moduleRef.get(CronJobRepository, {
      strict: false,
    });
  }

  public async createCvatManifest(
    dto: JobCvatDto,
    requestType: JobRequestType,
    tokenFundAmount: number,
  ): Promise<CvatManifestDto> {
    const { generateUrls } = this.createManifestActions[requestType];

    const urls = generateUrls(dto.data, dto.groundTruth);

    const jobBounty = await this.calculateJobBounty({
      requestType,
      fundAmount: tokenFundAmount,
      urls,
      nodesTotal: dto.labels[0]?.nodes?.length,
    });

    return {
      data: {
        data_url: urls.dataUrl.href,
        ...(urls.pointsUrl && {
          points_url: urls.pointsUrl?.href,
        }),
        ...(urls.boxesUrl && {
          boxes_url: urls.boxesUrl?.href,
        }),
      },
      annotation: {
        labels: dto.labels,
        description: dto.requesterDescription,
        user_guide: dto.userGuide,
        type: requestType,
        job_size: this.cvatConfigService.jobSize,
        ...(dto.qualifications && {
          qualifications: dto.qualifications,
        }),
      },
      validation: {
        min_quality: dto.minQuality,
        val_size: this.cvatConfigService.valSize,
        gt_url: urls.gtUrl.href,
      },
      job_bounty: jobBounty,
    };
  }

  public async createHCaptchaManifest(
    jobDto: JobCaptchaDto,
  ): Promise<HCaptchaManifestDto> {
    const jobType = jobDto.annotations.typeOfJob;
    const dataUrl = generateBucketUrl(jobDto.data, JobRequestType.HCAPTCHA);
    const objectsInBucket = await listObjectsInBucket(dataUrl);

    const commonManifestProperties = {
      job_mode: JobCaptchaMode.BATCH,
      requester_accuracy_target: jobDto.accuracyTarget,
      request_config: {},
      restricted_audience: this.buildHCaptchaRestrictedAudience(
        jobDto.advanced,
      ),
      requester_max_repeats: jobDto.maxRequests,
      requester_min_repeats: jobDto.minRequests,
      requester_question: { en: jobDto.annotations.labelingPrompt },
      job_total_tasks: objectsInBucket.length,
      task_bid_price: jobDto.annotations.taskBidPrice,
      taskdata_uri: await this.generateAndUploadTaskData(
        dataUrl.href,
        objectsInBucket,
      ),
      public_results: true,
      oracle_stake: HCAPTCHA_ORACLE_STAKE,
      repo_uri: this.web3ConfigService.hCaptchaReputationOracleURI,
      ro_uri: this.web3ConfigService.hCaptchaRecordingOracleURI,
      ...(jobDto.qualifications && {
        qualifications: jobDto.qualifications,
      }),
    };

    let groundTruthsData;
    if (jobDto.annotations.groundTruths) {
      groundTruthsData = await this.storageService.downloadJsonLikeData(
        jobDto.annotations.groundTruths,
      );
    }

    switch (jobType) {
      case JobCaptchaShapeType.COMPARISON:
        return {
          ...commonManifestProperties,
          request_type: JobCaptchaRequestType.IMAGE_LABEL_BINARY,
          groundtruth_uri: jobDto.annotations.groundTruths,
          requester_restricted_answer_set: {},
          requester_question_example: jobDto.annotations.exampleImages || [],
        };

      case JobCaptchaShapeType.CATEGORIZATION:
        return {
          ...commonManifestProperties,
          request_type: JobCaptchaRequestType.IMAGE_LABEL_MULTIPLE_CHOICE,
          groundtruth_uri: jobDto.annotations.groundTruths,
          requester_restricted_answer_set:
            this.buildHCaptchaRestrictedAnswerSet(groundTruthsData),
        };

      case JobCaptchaShapeType.POLYGON:
        if (!jobDto.annotations.label) {
          throw new ControlledError(
            ErrorJob.JobParamsValidationFailed,
            HttpStatus.BAD_REQUEST,
          );
        }

        const polygonManifest = {
          ...commonManifestProperties,
          request_type: JobCaptchaRequestType.IMAGE_LABEL_AREA_SELECT,
          request_config: {
            shape_type: JobCaptchaShapeType.POLYGON,
            min_shapes_per_image: HCAPTCHA_MIN_SHAPES_PER_IMAGE,
            max_shapes_per_image: HCAPTCHA_MAX_SHAPES_PER_IMAGE,
            min_points: HCAPTCHA_POLYGON_MIN_POINTS,
            max_points: HCAPTCHA_POLYGON_MAX_POINTS,
            minimum_selection_area_per_shape:
              HCAPTCHA_MINIMUM_SELECTION_AREA_PER_SHAPE,
          },
          groundtruth_uri: jobDto.annotations.groundTruths,
          requester_restricted_answer_set: {
            [jobDto.annotations.label!]: { en: jobDto.annotations.label },
          },
          requester_question_example: jobDto.annotations.exampleImages || [],
        };

        return polygonManifest;

      case JobCaptchaShapeType.POINT:
        if (!jobDto.annotations.label) {
          throw new ControlledError(
            ErrorJob.JobParamsValidationFailed,
            HttpStatus.BAD_REQUEST,
          );
        }

        const pointManifest = {
          ...commonManifestProperties,
          request_type: JobCaptchaRequestType.IMAGE_LABEL_AREA_SELECT,
          request_config: {
            shape_type: jobType,
            min_shapes_per_image: HCAPTCHA_MIN_SHAPES_PER_IMAGE,
            max_shapes_per_image: HCAPTCHA_MAX_SHAPES_PER_IMAGE,
            min_points: HCAPTCHA_LANDMARK_MIN_POINTS,
            max_points: HCAPTCHA_LANDMARK_MAX_POINTS,
          },
          groundtruth_uri: jobDto.annotations.groundTruths,
          requester_restricted_answer_set: {
            [jobDto.annotations.label!]: { en: jobDto.annotations.label },
          },
          requester_question_example: jobDto.annotations.exampleImages || [],
        };

        return pointManifest;
      case JobCaptchaShapeType.BOUNDING_BOX:
        if (!jobDto.annotations.label) {
          throw new ControlledError(
            ErrorJob.JobParamsValidationFailed,
            HttpStatus.BAD_REQUEST,
          );
        }

        const boundingBoxManifest = {
          ...commonManifestProperties,
          request_type: JobCaptchaRequestType.IMAGE_LABEL_AREA_SELECT,
          request_config: {
            shape_type: jobType,
            min_shapes_per_image: HCAPTCHA_MIN_SHAPES_PER_IMAGE,
            max_shapes_per_image: HCAPTCHA_MAX_SHAPES_PER_IMAGE,
            min_points: HCAPTCHA_BOUNDING_BOX_MIN_POINTS,
            max_points: HCAPTCHA_BOUNDING_BOX_MAX_POINTS,
          },
          groundtruth_uri: jobDto.annotations.groundTruths,
          requester_restricted_answer_set: {
            [jobDto.annotations.label!]: { en: jobDto.annotations.label },
          },
          requester_question_example: jobDto.annotations.exampleImages || [],
        };

        return boundingBoxManifest;
      case JobCaptchaShapeType.IMMO:
        if (!jobDto.annotations.label) {
          throw new ControlledError(
            ErrorJob.JobParamsValidationFailed,
            HttpStatus.BAD_REQUEST,
          );
        }

        const immoManifest = {
          ...commonManifestProperties,
          request_type: JobCaptchaRequestType.TEXT_FREEE_NTRY,
          request_config: {
            multiple_choice_max_choices: 1,
            multiple_choice_min_choices: 1,
            overlap_threshold: null,
            answer_type: 'str',
            max_length: HCAPTCHA_IMMO_MAX_LENGTH,
            min_length: HCAPTCHA_IMMO_MIN_LENGTH,
          },
          requester_restricted_answer_set: {
            [jobDto.annotations.label!]: { en: jobDto.annotations.label },
          },
          taskdata: [],
        };

        return immoManifest;

      default:
        throw new ControlledError(
          ErrorJob.HCaptchaInvalidJobType,
          HttpStatus.CONFLICT,
        );
    }
  }

  public async createAudinoManifest(
    dto: JobAudinoDto,
    requestType: JobRequestType,
    tokenFundAmount: number,
  ): Promise<any> {
    const { generateUrls } = this.createManifestActions[requestType];
    const urls = generateUrls(dto.data, dto.groundTruth);
    const totalSegments = Math.ceil(
      (dto.audioDuration * 1000) / dto.segmentDuration,
    );

    const jobBounty =
      ethers.parseUnits(tokenFundAmount.toString(), 'ether') /
      BigInt(totalSegments);

    return {
      annotation: {
        description: dto.requesterDescription,
        labels: dto.labels,
        qualifications: dto.qualifications || [],
        type: requestType,
        user_guide: dto.userGuide,
        segment_duration: dto.segmentDuration,
      },
      data: {
        data_url: urls.dataUrl.href,
      },
      job_bounty: ethers.formatEther(jobBounty),
      validation: {
        gt_url: urls.gtUrl.href,
        min_quality: dto.minQuality,
      },
    };
  }

  private buildHCaptchaRestrictedAudience(advanced: JobCaptchaAdvancedDto) {
    const restrictedAudience: RestrictedAudience = {};

    restrictedAudience.sitekey = [
      {
        [this.authConfigService.hCaptchaSiteKey]: {
          score: 1,
        },
      },
    ];

    if (advanced.workerLanguage) {
      restrictedAudience.lang = [{ [advanced.workerLanguage]: { score: 1 } }];
    }

    if (advanced.workerLocation) {
      restrictedAudience.country = [
        { [advanced.workerLocation]: { score: 1 } },
      ];
    }

    if (advanced.targetBrowser) {
      restrictedAudience.browser = [{ [advanced.targetBrowser]: { score: 1 } }];
    }

    return restrictedAudience;
  }

  private buildHCaptchaRestrictedAnswerSet(groundTruthsData: any) {
    const maxElements = 3;
    const outputObject: any = {};

    let elementCount = 0;

    for (const key of Object.keys(groundTruthsData)) {
      if (elementCount >= maxElements) {
        break;
      }

      const value = groundTruthsData[key][0][0];
      outputObject[value] = { en: value, answer_example_uri: key };
      elementCount++;
    }

    // Default case
    outputObject['0'] = { en: HCAPTCHA_NOT_PRESENTED_LABEL };

    return outputObject;
  }

  public async generateAndUploadTaskData(
    dataUrl: string,
    objectNames: string[],
  ) {
    const data = objectNames.map((objectName) => {
      return {
        datapoint_uri: `${dataUrl}/${objectName}`,
        datapoint_hash: 'undefined-hash',
        task_key: uuidv4(),
      };
    });

    const { url } = await this.storageService.uploadJsonLikeData(data);
    return url;
  }

  private createJobSpecificActions: Record<JobRequestType, RequestAction> = {
    [JobRequestType.HCAPTCHA]: {
      createManifest: (dto: JobCaptchaDto) => this.createHCaptchaManifest(dto),
    },
    [JobRequestType.FORTUNE]: {
      createManifest: async (
        dto: JobFortuneDto,
        requestType: JobRequestType,
        fundAmount: number,
      ) => ({
        ...dto,
        requestType,
        fundAmount,
      }),
    },
    [JobRequestType.IMAGE_POLYGONS]: {
      createManifest: (
        dto: JobCvatDto,
        requestType: JobRequestType,
        fundAmount: number,
      ) => this.createCvatManifest(dto, requestType, fundAmount),
    },
    [JobRequestType.IMAGE_BOXES]: {
      createManifest: (
        dto: JobCvatDto,
        requestType: JobRequestType,
        fundAmount: number,
      ) => this.createCvatManifest(dto, requestType, fundAmount),
    },
    [JobRequestType.IMAGE_POINTS]: {
      createManifest: (
        dto: JobCvatDto,
        requestType: JobRequestType,
        fundAmount: number,
      ) => this.createCvatManifest(dto, requestType, fundAmount),
    },
    [JobRequestType.IMAGE_BOXES_FROM_POINTS]: {
      createManifest: (
        dto: JobCvatDto,
        requestType: JobRequestType,
        fundAmount: number,
      ) => this.createCvatManifest(dto, requestType, fundAmount),
    },
    [JobRequestType.IMAGE_SKELETONS_FROM_BOXES]: {
      createManifest: (
        dto: JobCvatDto,
        requestType: JobRequestType,
        fundAmount: number,
      ) => this.createCvatManifest(dto, requestType, fundAmount),
    },
    [JobRequestType.AUDIO_TRANSCRIPTION]: {
      createManifest: (
        dto: JobAudinoDto,
        requestType: JobRequestType,
        fundAmount: number,
      ) => this.createAudinoManifest(dto, requestType, fundAmount),
    },
  };

  private createEscrowSpecificActions: Record<JobRequestType, EscrowAction> = {
    [JobRequestType.HCAPTCHA]: {
      getTrustedHandlers: () => [],
    },
    [JobRequestType.FORTUNE]: {
      getTrustedHandlers: () => [],
    },
    [JobRequestType.IMAGE_POLYGONS]: {
      getTrustedHandlers: () => [],
    },
    [JobRequestType.IMAGE_BOXES]: {
      getTrustedHandlers: () => [],
    },
    [JobRequestType.IMAGE_POINTS]: {
      getTrustedHandlers: () => [],
    },
    [JobRequestType.IMAGE_BOXES_FROM_POINTS]: {
      getTrustedHandlers: () => [],
    },
    [JobRequestType.IMAGE_SKELETONS_FROM_BOXES]: {
      getTrustedHandlers: () => [],
    },
    [JobRequestType.AUDIO_TRANSCRIPTION]: {
      getTrustedHandlers: () => [],
    },
  };

  private createManifestActions: Record<JobRequestType, ManifestAction> = {
    [JobRequestType.HCAPTCHA]: {
      getElementsCount: async () => 0,
      generateUrls: () => ({ dataUrl: new URL(''), gtUrl: new URL('') }),
    },
    [JobRequestType.FORTUNE]: {
      getElementsCount: async () => 0,
      generateUrls: () => ({ dataUrl: new URL(''), gtUrl: new URL('') }),
    },
    [JobRequestType.IMAGE_POLYGONS]: {
      getElementsCount: async (urls: GenerateUrls) => {
        const gt = (await this.storageService.downloadJsonLikeData(
          `${urls.gtUrl.protocol}//${urls.gtUrl.host}${urls.gtUrl.pathname}`,
        )) as any;
        if (!gt || !gt.images || gt.images.length === 0)
          throw new ControlledError(
            ErrorJob.GroundThuthValidationFailed,
            HttpStatus.BAD_REQUEST,
          );

        const data = await listObjectsInBucket(urls.dataUrl);
        if (!data || data.length === 0 || !data[0])
          throw new ControlledError(
            ErrorJob.DatasetValidationFailed,
            HttpStatus.BAD_REQUEST,
          );

        await this.checkImageConsistency(gt.images, data);

        return data.length - gt.images.length;
      },
      generateUrls: (
        data: CvatDataDto,
        groundTruth: StorageDataDto,
      ): GenerateUrls => {
        const requestType = JobRequestType.IMAGE_POLYGONS;
        return {
          dataUrl: generateBucketUrl(data.dataset, requestType),
          gtUrl: generateBucketUrl(groundTruth, requestType),
        };
      },
    },
    [JobRequestType.IMAGE_BOXES]: {
      getElementsCount: async (urls: GenerateUrls) => {
        const gt = (await this.storageService.downloadJsonLikeData(
          `${urls.gtUrl.protocol}//${urls.gtUrl.host}${urls.gtUrl.pathname}`,
        )) as any;
        if (!gt || !gt.images || gt.images.length === 0)
          throw new ControlledError(
            ErrorJob.GroundThuthValidationFailed,
            HttpStatus.BAD_REQUEST,
          );

        const data = await listObjectsInBucket(urls.dataUrl);
        if (!data || data.length === 0 || !data[0])
          throw new ControlledError(
            ErrorJob.DatasetValidationFailed,
            HttpStatus.BAD_REQUEST,
          );

        await this.checkImageConsistency(gt.images, data);

        return data.length - gt.images.length;
      },
      generateUrls: (
        data: CvatDataDto,
        groundTruth: StorageDataDto,
      ): GenerateUrls => {
        const requestType = JobRequestType.IMAGE_BOXES;
        return {
          dataUrl: generateBucketUrl(data.dataset, requestType),
          gtUrl: generateBucketUrl(groundTruth, requestType),
        };
      },
    },
    [JobRequestType.IMAGE_POINTS]: {
      getElementsCount: async (urls: GenerateUrls) => {
        const gt = (await this.storageService.downloadJsonLikeData(
          `${urls.gtUrl.protocol}//${urls.gtUrl.host}${urls.gtUrl.pathname}`,
        )) as any;
        if (!gt || !gt.images || gt.images.length === 0)
          throw new ControlledError(
            ErrorJob.GroundThuthValidationFailed,
            HttpStatus.BAD_REQUEST,
          );

        const data = await listObjectsInBucket(urls.dataUrl);
        if (!data || data.length === 0 || !data[0])
          throw new ControlledError(
            ErrorJob.DatasetValidationFailed,
            HttpStatus.BAD_REQUEST,
          );

        await this.checkImageConsistency(gt.images, data);

        return data.length - gt.images.length;
      },
      generateUrls: (
        data: CvatDataDto,
        groundTruth: StorageDataDto,
      ): GenerateUrls => {
        const requestType = JobRequestType.IMAGE_POINTS;

        return {
          dataUrl: generateBucketUrl(data.dataset, requestType),
          gtUrl: generateBucketUrl(groundTruth, requestType),
        };
      },
    },
    [JobRequestType.IMAGE_BOXES_FROM_POINTS]: {
      getElementsCount: async (urls: GenerateUrls) =>
        this.getCvatElementsCount(urls.gtUrl, urls.pointsUrl!),
      generateUrls: (
        data: CvatDataDto,
        groundTruth: StorageDataDto,
      ): GenerateUrls => {
        if (!data.points) {
          throw new ControlledError(ErrorJob.DataNotExist, HttpStatus.CONFLICT);
        }

        const requestType = JobRequestType.IMAGE_BOXES_FROM_POINTS;

        return {
          dataUrl: generateBucketUrl(data.dataset, requestType),
          gtUrl: generateBucketUrl(groundTruth, requestType),
          pointsUrl: generateBucketUrl(data.points, requestType),
        };
      },
    },
    [JobRequestType.IMAGE_SKELETONS_FROM_BOXES]: {
      getElementsCount: async (urls: GenerateUrls) =>
        this.getCvatElementsCount(urls.gtUrl, urls.boxesUrl!),
      generateUrls: (
        data: CvatDataDto,
        groundTruth: StorageDataDto,
      ): GenerateUrls => {
        if (!data.boxes) {
          throw new ControlledError(ErrorJob.DataNotExist, HttpStatus.CONFLICT);
        }

        const requestType = JobRequestType.IMAGE_SKELETONS_FROM_BOXES;

        return {
          dataUrl: generateBucketUrl(data.dataset, requestType),
          gtUrl: generateBucketUrl(groundTruth, requestType),
          boxesUrl: generateBucketUrl(data.boxes, requestType),
        };
      },
    },
    [JobRequestType.AUDIO_TRANSCRIPTION]: {
      getElementsCount: async () => 0,
      generateUrls: (
        data: CvatDataDto,
        groundTruth: StorageDataDto,
      ): GenerateUrls => {
        const requestType = JobRequestType.AUDIO_TRANSCRIPTION;

        return {
          dataUrl: generateBucketUrl(data.dataset, requestType),
          gtUrl: generateBucketUrl(groundTruth, requestType),
        };
      },
    },
  };

  private getOraclesSpecificActions: Record<JobRequestType, OracleAction> = {
    [JobRequestType.HCAPTCHA]: {
      getOracleAddresses: (): OracleAddresses => {
        const exchangeOracle = this.web3ConfigService.hCaptchaOracleAddress;
        const recordingOracle = this.web3ConfigService.hCaptchaOracleAddress;
        const reputationOracle = this.web3ConfigService.hCaptchaOracleAddress;

        return { exchangeOracle, recordingOracle, reputationOracle };
      },
    },
    [JobRequestType.FORTUNE]: {
      getOracleAddresses: (): OracleAddresses => {
        const exchangeOracle =
          this.web3ConfigService.fortuneExchangeOracleAddress;
        const recordingOracle =
          this.web3ConfigService.fortuneRecordingOracleAddress;
        const reputationOracle = this.web3ConfigService.reputationOracleAddress;

        return { exchangeOracle, recordingOracle, reputationOracle };
      },
    },
    [JobRequestType.IMAGE_POLYGONS]: {
      getOracleAddresses: (): OracleAddresses => {
        const exchangeOracle = this.web3ConfigService.cvatExchangeOracleAddress;
        const recordingOracle =
          this.web3ConfigService.cvatRecordingOracleAddress;
        const reputationOracle = this.web3ConfigService.reputationOracleAddress;

        return { exchangeOracle, recordingOracle, reputationOracle };
      },
    },
    [JobRequestType.IMAGE_BOXES]: {
      getOracleAddresses: (): OracleAddresses => {
        const exchangeOracle = this.web3ConfigService.cvatExchangeOracleAddress;
        const recordingOracle =
          this.web3ConfigService.cvatRecordingOracleAddress;
        const reputationOracle = this.web3ConfigService.reputationOracleAddress;

        return { exchangeOracle, recordingOracle, reputationOracle };
      },
    },
    [JobRequestType.IMAGE_POINTS]: {
      getOracleAddresses: (): OracleAddresses => {
        const exchangeOracle = this.web3ConfigService.cvatExchangeOracleAddress;
        const recordingOracle =
          this.web3ConfigService.cvatRecordingOracleAddress;
        const reputationOracle = this.web3ConfigService.reputationOracleAddress;

        return { exchangeOracle, recordingOracle, reputationOracle };
      },
    },
    [JobRequestType.IMAGE_BOXES_FROM_POINTS]: {
      getOracleAddresses: (): OracleAddresses => {
        const exchangeOracle = this.web3ConfigService.cvatExchangeOracleAddress;
        const recordingOracle =
          this.web3ConfigService.cvatRecordingOracleAddress;
        const reputationOracle = this.web3ConfigService.reputationOracleAddress;

        return { exchangeOracle, recordingOracle, reputationOracle };
      },
    },
    [JobRequestType.IMAGE_SKELETONS_FROM_BOXES]: {
      getOracleAddresses: (): OracleAddresses => {
        const exchangeOracle = this.web3ConfigService.cvatExchangeOracleAddress;
        const recordingOracle =
          this.web3ConfigService.cvatRecordingOracleAddress;
        const reputationOracle = this.web3ConfigService.reputationOracleAddress;

        return { exchangeOracle, recordingOracle, reputationOracle };
      },
    },
    [JobRequestType.AUDIO_TRANSCRIPTION]: {
      getOracleAddresses: (): OracleAddresses => {
        return {
          exchangeOracle: this.web3ConfigService.audinoExchangeOracleAddress,
          recordingOracle: this.web3ConfigService.audinoRecordingOracleAddress,
          reputationOracle: this.web3ConfigService.reputationOracleAddress,
        };
      },
    },
  };

  private async checkImageConsistency(
    gtImages: any[],
    dataFiles: string[],
  ): Promise<void> {
    const gtFileNames = gtImages.map((image: any) => image.file_name);
    const baseFileNames = dataFiles.map((fileName) =>
      fileName.split('/').pop(),
    );
    const missingFileNames = gtFileNames.filter(
      (fileName: any) => !baseFileNames.includes(fileName),
    );

    if (missingFileNames.length !== 0) {
      throw new ControlledError(
        ErrorJob.ImageConsistency,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public async createJob(
    user: UserEntity,
    requestType: JobRequestType,
    dto: CreateJob,
  ): Promise<number> {
    let { chainId, reputationOracle, exchangeOracle, recordingOracle } = dto;
    if (!Object.values(JobRequestType).includes(requestType)) {
      throw new ControlledError(
        ErrorJob.InvalidRequestType,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Select network
    chainId = chainId || this.routingProtocolService.selectNetwork();
    this.web3Service.validateChainId(chainId);

    // Check if not whitelisted user has an active payment method
    const whitelisted = await this.whitelistService.isUserWhitelisted(user.id);
    if (!whitelisted) {
      if (
        !(await this.paymentService.getDefaultPaymentMethod(
          user.stripeCustomerId,
        ))
      )
        throw new ControlledError(
          ErrorJob.NotActiveCard,
          HttpStatus.BAD_REQUEST,
        );
    }

    const feePercentage = Number(
      await this.getOracleFee(this.web3Service.getOperatorAddress(), chainId),
    );

    const paymentCurrencyRate = await this.rateService.getRate(
      dto.paymentCurrency,
      FiatCurrency.USD,
    );
    const fundTokenRate = await this.rateService.getRate(
      FiatCurrency.USD,
      dto.escrowFundToken,
    );

    const paymentTokenDecimals = getTokenDecimals(
      chainId,
      dto.paymentCurrency as EscrowFundToken,
    );

    const fundTokenDecimals = getTokenDecimals(
      chainId,
      dto.escrowFundToken as EscrowFundToken,
    );

    const paymentCurrencyFee = Number(
      max(
        div(this.serverConfigService.minimumFeeUsd, paymentCurrencyRate),
        mul(div(feePercentage, 100), dto.paymentAmount),
      ).toFixed(paymentTokenDecimals),
    );
    const totalPaymentAmount = Number(
      add(dto.paymentAmount, paymentCurrencyFee).toFixed(paymentTokenDecimals),
    );

    const fundTokenFee =
      dto.paymentCurrency === dto.escrowFundToken
        ? paymentCurrencyFee
        : Number(
            mul(
              mul(paymentCurrencyFee, paymentCurrencyRate),
              fundTokenRate,
            ).toFixed(fundTokenDecimals),
          );
    const fundTokenAmount =
      dto.paymentCurrency === dto.escrowFundToken
        ? dto.paymentAmount
        : Number(
            mul(
              mul(dto.paymentAmount, paymentCurrencyRate),
              fundTokenRate,
            ).toFixed(fundTokenDecimals),
          );

    // Select oracles
    if (!reputationOracle || !exchangeOracle || !recordingOracle) {
      const selectedOracles = await this.routingProtocolService.selectOracles(
        chainId,
        requestType,
      );

      exchangeOracle = exchangeOracle || selectedOracles.exchangeOracle;
      recordingOracle = recordingOracle || selectedOracles.recordingOracle;
      reputationOracle = reputationOracle || selectedOracles.reputationOracle;
    } else {
      // Validate if all oracles are provided
      await this.routingProtocolService.validateOracles(
        chainId,
        requestType,
        reputationOracle,
        exchangeOracle,
        recordingOracle,
      );
    }

    if (dto.qualifications) {
      const validQualifications =
        await this.qualificationService.getQualifications(chainId);

      const validQualificationReferences = validQualifications.map(
        (q) => q.reference,
      );

      dto.qualifications.forEach((qualification) => {
        if (!validQualificationReferences.includes(qualification)) {
          throw new ControlledError(
            ErrorQualification.InvalidQualification,
            HttpStatus.BAD_REQUEST,
          );
        }
      });
    }

    const { createManifest } = this.createJobSpecificActions[requestType];

    let jobEntity = new JobEntity();

    if (dto instanceof JobQuickLaunchDto) {
      if (!dto.manifestHash) {
        const { filename } = parseUrl(dto.manifestUrl);

        if (!filename) {
          throw new ControlledError(
            ErrorJob.ManifestHashNotExist,
            HttpStatus.CONFLICT,
          );
        }

        jobEntity.manifestHash = filename;
      } else {
        jobEntity.manifestHash = dto.manifestHash;
      }

      jobEntity.manifestUrl = dto.manifestUrl;
    } else {
      const manifestOrigin = await createManifest(
        dto,
        requestType,
        fundTokenAmount,
      );

      const { url, hash } = await this.uploadManifest(
        requestType,
        chainId,
        manifestOrigin,
      );

      jobEntity.manifestUrl = url;
      jobEntity.manifestHash = hash;
    }

    const paymentEntity = await this.paymentService.createWithdrawalPayment(
      user.id,
      totalPaymentAmount,
      dto.paymentCurrency,
      paymentCurrencyRate,
    );

    jobEntity.chainId = chainId;
    jobEntity.reputationOracle = reputationOracle;
    jobEntity.exchangeOracle = exchangeOracle;
    jobEntity.recordingOracle = recordingOracle;
    jobEntity.userId = user.id;
    jobEntity.requestType = requestType;
    jobEntity.fee = fundTokenFee; // Fee in the token used to funding the escrow
    jobEntity.fundAmount = fundTokenAmount; // Amount in the token used to funding the escrow
    jobEntity.payments = [paymentEntity];
    jobEntity.token = dto.escrowFundToken;
    jobEntity.waitUntil = new Date();

    if (
      user.whitelist ||
      [JobRequestType.AUDIO_TRANSCRIPTION].includes(requestType)
    ) {
      jobEntity.status = JobStatus.MODERATION_PASSED;
    } else {
      jobEntity.status = JobStatus.PAID;
    }

    jobEntity = await this.jobRepository.updateOne(jobEntity);

    return jobEntity.id;
  }

  public async getCvatElementsCount(gtUrl: URL, dataUrl: URL): Promise<number> {
    const data = (await this.storageService.downloadJsonLikeData(
      dataUrl.href,
    )) as any;
    const gt = (await this.storageService.downloadJsonLikeData(
      gtUrl.href,
    )) as any;

    if (!gt || !gt.images || gt.images.length === 0) {
      throw new ControlledError(
        ErrorJob.GroundThuthValidationFailed,
        HttpStatus.BAD_REQUEST,
      );
    }

    let gtEntries = 0;

    gt.images.forEach((gtImage: CvatImageData) => {
      const { id } = data.images.find(
        (dataImage: CvatImageData) => dataImage.file_name === gtImage.file_name,
      );

      if (id) {
        const matchingAnnotations = data.annotations.filter(
          (dataAnnotation: CvatAnnotationData) =>
            dataAnnotation.image_id === id,
        );
        gtEntries += matchingAnnotations.length;
      }
    });

    return data.annotations.length - gtEntries;
  }

  public async calculateJobBounty(
    params: CvatCalculateJobBounty,
  ): Promise<string> {
    const { requestType, fundAmount, urls, nodesTotal } = params;

    const { getElementsCount } = this.createManifestActions[requestType];
    const elementsCount = await getElementsCount(urls);

    let jobSize = Number(this.cvatConfigService.jobSize);

    if (requestType === JobRequestType.IMAGE_SKELETONS_FROM_BOXES) {
      const jobSizeMultiplier = Number(
        this.cvatConfigService.skeletonsJobSizeMultiplier,
      );
      jobSize *= jobSizeMultiplier;
    }

    let totalJobs: number;

    // For each skeleton node CVAT creates a separate project thus increasing amount of jobs
    if (
      requestType === JobRequestType.IMAGE_SKELETONS_FROM_BOXES &&
      nodesTotal
    ) {
      totalJobs = Math.ceil(elementsCount / jobSize) * nodesTotal;
    } else {
      totalJobs = Math.ceil(elementsCount / jobSize);
    }
    const jobBounty =
      ethers.parseUnits(fundAmount.toString(), 'ether') / BigInt(totalJobs);
    return ethers.formatEther(jobBounty);
  }

  public async createEscrow(jobEntity: JobEntity): Promise<JobEntity> {
    const { getTrustedHandlers } =
      this.createEscrowSpecificActions[jobEntity.requestType];

    const signer = this.web3Service.getSigner(jobEntity.chainId);

    const escrowClient = await EscrowClient.build(signer);

    const escrowAddress = await escrowClient.createEscrow(
      (TOKEN_ADDRESSES[jobEntity.chainId as ChainId] ?? {})[
        jobEntity.token as EscrowFundToken
      ]!.address,
      getTrustedHandlers(),
      jobEntity.userId.toString(),
      {
        gasPrice: await this.web3Service.calculateGasPrice(jobEntity.chainId),
      },
    );

    if (!escrowAddress) {
      throw new ControlledError(ErrorEscrow.NotCreated, HttpStatus.NOT_FOUND);
    }

    jobEntity.status = JobStatus.CREATED;
    jobEntity.escrowAddress = escrowAddress;
    await this.jobRepository.updateOne(jobEntity);

    return jobEntity;
  }

  public async setupEscrow(jobEntity: JobEntity): Promise<JobEntity> {
    const { getOracleAddresses } =
      this.getOraclesSpecificActions[jobEntity.requestType];

    const signer = this.web3Service.getSigner(jobEntity.chainId);

    const escrowClient = await EscrowClient.build(signer);

    const manifest = (await this.storageService.downloadJsonLikeData(
      jobEntity.manifestUrl,
    )) as any;

    await this.validateManifest(jobEntity.requestType, manifest);

    const oracleAddresses = getOracleAddresses();

    const escrowConfig = {
      ...oracleAddresses,
      recordingOracleFee: await this.getOracleFee(
        oracleAddresses.recordingOracle,
        jobEntity.chainId,
      ),
      reputationOracleFee: await this.getOracleFee(
        oracleAddresses.reputationOracle,
        jobEntity.chainId,
      ),
      exchangeOracleFee: await this.getOracleFee(
        oracleAddresses.exchangeOracle,
        jobEntity.chainId,
      ),
      manifestUrl: jobEntity.manifestUrl,
      manifestHash: jobEntity.manifestHash,
    };

    await escrowClient.setup(jobEntity.escrowAddress, escrowConfig, {
      gasPrice: await this.web3Service.calculateGasPrice(jobEntity.chainId),
    });

    jobEntity.status = JobStatus.LAUNCHED;
    await this.jobRepository.updateOne(jobEntity);

    return jobEntity;
  }

  public async fundEscrow(jobEntity: JobEntity): Promise<JobEntity> {
    const signer = this.web3Service.getSigner(jobEntity.chainId);

    const escrowClient = await EscrowClient.build(signer);

    const token = (TOKEN_ADDRESSES[jobEntity.chainId as ChainId] ?? {})[
      jobEntity.token as EscrowFundToken
    ]!;

    const weiAmount = ethers.parseUnits(
      jobEntity.fundAmount.toString(),
      token.decimals,
    );
    await escrowClient.fund(jobEntity.escrowAddress, weiAmount, {
      gasPrice: await this.web3Service.calculateGasPrice(jobEntity.chainId),
    });

    jobEntity.status = JobStatus.FUNDED;
    await this.jobRepository.updateOne(jobEntity);

    const oracleType = this.getOracleType(jobEntity.requestType);
    const webhookEntity = new WebhookEntity();
    Object.assign(webhookEntity, {
      escrowAddress: jobEntity.escrowAddress,
      chainId: jobEntity.chainId,
      eventType: EventType.ESCROW_CREATED,
      oracleType: oracleType,
      hasSignature: oracleType !== OracleType.HCAPTCHA ? true : false,
    });
    await this.webhookRepository.createUnique(webhookEntity);

    return jobEntity;
  }

  public async requestToCancelJobById(
    userId: number,
    jobId: number,
  ): Promise<void> {
    const jobEntity = await this.jobRepository.findOneByIdAndUserId(
      jobId,
      userId,
    );

    if (!jobEntity) {
      throw new ControlledError(ErrorJob.NotFound, HttpStatus.NOT_FOUND);
    }

    await this.requestToCancelJob(jobEntity);
  }

  public async requestToCancelJobByAddress(
    userId: number,
    chainId: number,
    escrowAddress: string,
  ): Promise<void> {
    await this.web3Service.validateChainId(chainId);

    const jobEntity = await this.jobRepository.findOneByChainIdAndEscrowAddress(
      chainId,
      escrowAddress,
    );

    if (!jobEntity || (jobEntity && jobEntity.userId !== userId)) {
      throw new ControlledError(ErrorJob.NotFound, HttpStatus.NOT_FOUND);
    }

    await this.requestToCancelJob(jobEntity);
  }

  /// This is a duplicate from CronJobService.isCronJobRunning to avoid circular dependency
  private async isCronJobRunning(cronJobType: CronJobType): Promise<boolean> {
    const lastCronJob = await this.cronJobRepository.findOneByType(cronJobType);

    if (!lastCronJob || lastCronJob.completedAt) {
      return false;
    }
    return true;
  }

  private async requestToCancelJob(jobEntity: JobEntity): Promise<void> {
    if (!CANCEL_JOB_STATUSES.includes(jobEntity.status)) {
      throw new ControlledError(
        ErrorJob.InvalidStatusCancellation,
        HttpStatus.CONFLICT,
      );
    }

    let status = JobStatus.CANCELED;
    switch (jobEntity.status) {
      case JobStatus.PAID:
        if (await this.isCronJobRunning(CronJobType.CreateEscrow)) {
          status = JobStatus.FAILED;
        }
        break;
      case JobStatus.CREATED:
        if (await this.isCronJobRunning(CronJobType.SetupEscrow)) {
          status = JobStatus.FAILED;
        }
        break;
      case JobStatus.FUNDED:
        if (await this.isCronJobRunning(CronJobType.FundEscrow)) {
          status = JobStatus.FAILED;
        }
        break;
      default:
        status = JobStatus.TO_CANCEL;
        break;
    }

    if (status === JobStatus.FAILED) {
      throw new ControlledError(
        ErrorJob.CancelWhileProcessing,
        HttpStatus.CONFLICT,
      );
    }

    if (status === JobStatus.CANCELED) {
      await this.paymentService.createRefundPayment({
        refundAmount: jobEntity.fundAmount,
        refundCurrency: jobEntity.token,
        userId: jobEntity.userId,
        jobId: jobEntity.id,
      });
    }

    jobEntity.status = status;

    jobEntity.retriesCount = 0;
    await this.jobRepository.updateOne(jobEntity);
  }

  public async uploadManifest(
    requestType: JobRequestType,
    chainId: ChainId,
    data: any,
  ): Promise<any> {
    let manifestFile = data;

    if (this.pgpConfigService.encrypt) {
      const { getOracleAddresses } =
        this.getOraclesSpecificActions[requestType];

      const signer = this.web3Service.getSigner(chainId);
      const publicKeys: string[] = [
        await KVStoreUtils.getPublicKey(chainId, signer.address),
      ];
      const oracleAddresses = getOracleAddresses();
      for (const address of Object.values(oracleAddresses)) {
        const publicKey = await KVStoreUtils.getPublicKey(chainId, address);
        if (publicKey) publicKeys.push(publicKey);
      }
      const encryptedManifest = await this.encryption.signAndEncrypt(
        JSON.stringify(data),
        publicKeys,
      );
      manifestFile = encryptedManifest;
    }

    const uploadedFile =
      await this.storageService.uploadJsonLikeData(manifestFile);

    if (!uploadedFile) {
      throw new ControlledError(
        ErrorBucket.UnableSaveFile,
        HttpStatus.BAD_REQUEST,
      );
    }

    return uploadedFile;
  }

  private async validateManifest(
    requestType: JobRequestType,
    manifest: FortuneManifestDto | CvatManifestDto | HCaptchaManifestDto,
  ): Promise<boolean> {
    let dtoCheck;

    if (requestType === JobRequestType.FORTUNE) {
      dtoCheck = new FortuneManifestDto();
    } else if (requestType === JobRequestType.HCAPTCHA) {
      return true;
      dtoCheck = new HCaptchaManifestDto();
    } else if (requestType === JobRequestType.AUDIO_TRANSCRIPTION) {
      dtoCheck = new AudinoManifestDto();
    } else {
      dtoCheck = new CvatManifestDto();
    }

    Object.assign(dtoCheck, manifest);

    const validationErrors: ValidationError[] = await validate(dtoCheck);
    if (validationErrors.length > 0) {
      this.logger.log(
        ErrorJob.ManifestValidationFailed,
        JobService.name,
        validationErrors,
      );
      throw new ControlledError(
        ErrorJob.ManifestValidationFailed,
        HttpStatus.NOT_FOUND,
      );
    }

    return true;
  }

  public async getJobsByStatus(
    data: GetJobsDto,
    userId: number,
  ): Promise<PageDto<JobListDto>> {
    try {
      if (data.chainId && data.chainId.length > 0)
        data.chainId.forEach((chainId) =>
          this.web3Service.validateChainId(Number(chainId)),
        );

      const { entities, itemCount } = await this.jobRepository.fetchFiltered(
        data,
        userId,
      );

      const jobs = entities.map((job) => {
        return {
          jobId: job.id,
          escrowAddress: job.escrowAddress,
          network: NETWORKS[job.chainId as ChainId]!.title,
          fundAmount: job.fundAmount,
          currency: job.token as EscrowFundToken,
          status: job.status,
        };
      });

      return new PageDto(data.page!, data.pageSize!, itemCount, jobs);
    } catch (error) {
      throw new ControlledError(
        error.message,
        HttpStatus.BAD_REQUEST,
        error.stack,
      );
    }
  }

  public async getResult(
    userId: number,
    jobId: number,
  ): Promise<FortuneFinalResultDto[] | string> {
    const jobEntity = await this.jobRepository.findOneByIdAndUserId(
      jobId,
      userId,
    );

    if (!jobEntity) {
      throw new ControlledError(ErrorJob.NotFound, HttpStatus.NOT_FOUND);
    }

    if (!jobEntity.escrowAddress) {
      throw new ControlledError(ErrorJob.ResultNotFound, HttpStatus.NOT_FOUND);
    }

    const signer = this.web3Service.getSigner(jobEntity.chainId);
    const escrowClient = await EscrowClient.build(signer);

    const finalResultUrl = await escrowClient.getResultsUrl(
      jobEntity.escrowAddress,
    );

    if (!finalResultUrl) {
      throw new ControlledError(ErrorJob.ResultNotFound, HttpStatus.NOT_FOUND);
    }

    if (jobEntity.requestType === JobRequestType.FORTUNE) {
      const data = (await this.storageService.downloadJsonLikeData(
        finalResultUrl,
      )) as Array<FortuneFinalResultDto>;

      if (!data.length) {
        throw new ControlledError(
          ErrorJob.ResultNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const allFortuneValidationErrors: ValidationError[] = [];

      for (const fortune of data) {
        const fortuneDtoCheck = new FortuneFinalResultDto();
        Object.assign(fortuneDtoCheck, fortune);
        const fortuneValidationErrors: ValidationError[] =
          await validate(fortuneDtoCheck);
        allFortuneValidationErrors.push(...fortuneValidationErrors);
      }

      if (allFortuneValidationErrors.length > 0) {
        this.logger.log(
          ErrorJob.ResultValidationFailed,
          JobService.name,
          allFortuneValidationErrors,
        );
        throw new ControlledError(
          ErrorJob.ResultValidationFailed,
          HttpStatus.NOT_FOUND,
        );
      }
      return data;
    }
    return finalResultUrl;
  }

  public async downloadJobResults(
    userId: number,
    jobId: number,
  ): Promise<{
    filename: string;
    contents: Buffer;
  }> {
    const jobEntity = await this.jobRepository.findOneByIdAndUserId(
      jobId,
      userId,
    );

    if (!jobEntity) {
      throw new ControlledError(ErrorJob.NotFound, HttpStatus.NOT_FOUND);
    }

    if (!jobEntity.escrowAddress) {
      throw new ControlledError(ErrorJob.ResultNotFound, HttpStatus.NOT_FOUND);
    }

    if (jobEntity.requestType === JobRequestType.FORTUNE) {
      throw new ControlledError(
        ErrorJob.InvalidRequestType,
        HttpStatus.BAD_REQUEST,
      );
    }

    const signer = this.web3Service.getSigner(jobEntity.chainId);
    const escrowClient = await EscrowClient.build(signer);

    const finalResultUrl = await escrowClient.getResultsUrl(
      jobEntity.escrowAddress,
    );

    if (!finalResultUrl) {
      throw new ControlledError(ErrorJob.ResultNotFound, HttpStatus.NOT_FOUND);
    }

    const contents = await this.storageService.downloadFile(finalResultUrl);
    const filename = finalResultUrl.split('/').at(-1) as string;

    return {
      filename,
      contents,
    };
  }

  public handleProcessJobFailure = async (
    jobEntity: JobEntity,
    failedReason: string,
  ) => {
    if (jobEntity.retriesCount < this.serverConfigService.maxRetryCount) {
      jobEntity.retriesCount += 1;
    } else {
      jobEntity.failedReason = failedReason;
      jobEntity.status = JobStatus.FAILED;
    }
    await this.jobRepository.updateOne(jobEntity);
  };

  public getOracleType(requestType: JobRequestType): OracleType {
    if (requestType === JobRequestType.FORTUNE) {
      return OracleType.FORTUNE;
    } else if (requestType === JobRequestType.HCAPTCHA) {
      return OracleType.HCAPTCHA;
    } else if (requestType === JobRequestType.AUDIO_TRANSCRIPTION) {
      return OracleType.AUDINO;
    } else {
      return OracleType.CVAT;
    }
  }

  public async processEscrowCancellation(
    jobEntity: JobEntity,
  ): Promise<EscrowCancelDto> {
    const { chainId, escrowAddress } = jobEntity;

    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const escrowStatus = await escrowClient.getStatus(escrowAddress);
    if (
      escrowStatus === EscrowStatus.Complete ||
      escrowStatus === EscrowStatus.Paid ||
      escrowStatus === EscrowStatus.Cancelled
    ) {
      throw new ControlledError(
        ErrorEscrow.InvalidStatusCancellation,
        HttpStatus.BAD_REQUEST,
      );
    }

    const balance = await escrowClient.getBalance(escrowAddress);
    if (balance === 0n) {
      throw new ControlledError(
        ErrorEscrow.InvalidBalanceCancellation,
        HttpStatus.BAD_REQUEST,
      );
    }

    return escrowClient.cancel(escrowAddress, {
      gasPrice: await this.web3Service.calculateGasPrice(chainId),
    });
  }

  public async escrowFailedWebhook(dto: WebhookDataDto): Promise<void> {
    if (dto.eventType !== EventType.ESCROW_FAILED) {
      throw new ControlledError(
        ErrorJob.InvalidEventType,
        HttpStatus.BAD_REQUEST,
      );
    }
    const jobEntity = await this.jobRepository.findOneByChainIdAndEscrowAddress(
      dto.chainId,
      dto.escrowAddress,
    );

    if (!jobEntity) {
      throw new ControlledError(ErrorJob.NotFound, HttpStatus.NOT_FOUND);
    }

    if (jobEntity.status !== JobStatus.LAUNCHED) {
      throw new ControlledError(ErrorJob.NotLaunched, HttpStatus.CONFLICT);
    }

    if (!dto.eventData) {
      throw new ControlledError(
        'Event data is required but was not provided.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const reason = dto.eventData.reason;

    if (!reason) {
      throw new ControlledError(
        'Reason is undefined in event data.',
        HttpStatus.BAD_REQUEST,
      );
    }

    jobEntity.status = JobStatus.FAILED;
    jobEntity.failedReason = reason!;
    await this.jobRepository.updateOne(jobEntity);
  }

  public async getDetails(
    userId: number,
    jobId: number,
  ): Promise<JobDetailsDto> {
    const jobEntity = await this.jobRepository.findOneByIdAndUserId(
      jobId,
      userId,
    );

    if (!jobEntity) {
      throw new ControlledError(ErrorJob.NotFound, HttpStatus.NOT_FOUND);
    }

    const { chainId, escrowAddress, manifestUrl, manifestHash } = jobEntity;
    const signer = this.web3Service.getSigner(chainId);

    let escrow;

    if (escrowAddress) {
      escrow = await EscrowUtils.getEscrow(chainId, escrowAddress);
    }

    const manifestData = (await this.storageService.downloadJsonLikeData(
      manifestUrl,
    )) as any;

    if (!manifestData) {
      throw new ControlledError(
        ErrorJob.ManifestNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const baseManifestDetails = {
      chainId,
      tokenAddress: escrow ? escrow.token : ethers.ZeroAddress,
      requesterAddress: signer.address,
      fundAmount: escrow
        ? Number(ethers.formatEther(escrow.totalFundedAmount))
        : 0,
      exchangeOracleAddress: escrow?.exchangeOracle || ethers.ZeroAddress,
      recordingOracleAddress: escrow?.recordingOracle || ethers.ZeroAddress,
      reputationOracleAddress: escrow?.reputationOracle || ethers.ZeroAddress,
    };

    let specificManifestDetails;
    if (jobEntity.requestType === JobRequestType.FORTUNE) {
      const manifest = manifestData as FortuneManifestDto;
      specificManifestDetails = {
        title: manifest.requesterTitle,
        description: manifest.requesterDescription,
        requestType: JobRequestType.FORTUNE,
        submissionsRequired: manifest.submissionsRequired,
        ...(manifest.qualifications &&
          manifest.qualifications?.length > 0 && {
            qualifications: manifest.qualifications,
          }),
      };
    } else if (jobEntity.requestType === JobRequestType.HCAPTCHA) {
      const manifest = manifestData as HCaptchaManifestDto;
      specificManifestDetails = {
        requestType: JobRequestType.HCAPTCHA,
        submissionsRequired: manifest.job_total_tasks,
        ...(manifest.qualifications &&
          manifest.qualifications?.length > 0 && {
            qualifications: manifest.qualifications,
          }),
      };
    } else {
      const manifest = manifestData as CvatManifestDto;
      specificManifestDetails = {
        requestType: manifest.annotation?.type,
        submissionsRequired: manifest.annotation?.job_size,
        description: manifest.annotation?.description,
        ...(manifest.annotation?.qualifications &&
          manifest.annotation?.qualifications?.length > 0 && {
            qualifications: manifest.annotation?.qualifications,
          }),
      };
    }

    const manifestDetails = {
      ...baseManifestDetails,
      ...specificManifestDetails,
    };

    if (!escrowAddress) {
      return {
        details: {
          escrowAddress: ethers.ZeroAddress,
          manifestUrl,
          manifestHash,
          balance: 0,
          paidOut: 0,
          status: jobEntity.status,
          failedReason: jobEntity.failedReason,
        },
        manifest: manifestDetails,
      };
    }

    return {
      details: {
        escrowAddress,
        manifestUrl,
        manifestHash,
        balance: Number(ethers.formatEther(escrow?.balance || 0)),
        paidOut: Number(ethers.formatEther(escrow?.amountPaid || 0)),
        currency: jobEntity.token as EscrowFundToken,
        status: jobEntity.status,
        failedReason: jobEntity.failedReason,
      },
      manifest: manifestDetails,
    };
  }

  public async getTransferLogs(
    chainId: ChainId,
    tokenAddress: string,
    fromBlock: number,
    toBlock: string | number,
  ) {
    const signer = this.web3Service.getSigner(chainId);
    const filter = {
      address: tokenAddress,
      topics: [ethers.id('Transfer(address,address,uint256)')],
      fromBlock: fromBlock,
      toBlock: toBlock,
    };

    return signer.provider?.getLogs(filter);
  }

  public async getPaidOutAmount(
    chainId: ChainId,
    tokenAddress: string,
    escrowAddress: string,
  ): Promise<number> {
    const signer = this.web3Service.getSigner(chainId);
    const tokenContract: HMToken = HMToken__factory.connect(
      tokenAddress,
      signer,
    );

    const logs = await this.getTransferLogs(chainId, tokenAddress, 0, 'latest');
    let paidOutAmount = new Decimal(0);

    logs?.forEach((log) => {
      const parsedLog = tokenContract.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });
      const from = parsedLog?.args[0];
      const amount = parsedLog?.args[2];

      if (from === escrowAddress) {
        paidOutAmount = paidOutAmount.add(ethers.formatEther(amount));
      }
    });

    return Number(paidOutAmount);
  }

  private async getOracleFee(
    oracleAddress: string,
    chainId: ChainId,
  ): Promise<bigint> {
    let feeValue: string | undefined;

    try {
      feeValue = await KVStoreUtils.get(
        chainId,
        oracleAddress,
        KVStoreKeys.fee,
      );
    } catch {}

    return BigInt(feeValue ? feeValue : 1);
  }

  public async completeJob(dto: WebhookDataDto): Promise<void> {
    const jobEntity = await this.jobRepository.findOneByChainIdAndEscrowAddress(
      dto.chainId,
      dto.escrowAddress,
    );

    if (!jobEntity) {
      throw new ControlledError(ErrorJob.NotFound, HttpStatus.NOT_FOUND);
    }

    // If job status already completed by getDetails do nothing
    if (jobEntity.status === JobStatus.COMPLETED) {
      return;
    }
    if (
      jobEntity.status !== JobStatus.LAUNCHED &&
      jobEntity.status !== JobStatus.PARTIAL
    ) {
      throw new ControlledError(
        ErrorJob.InvalidStatusCompletion,
        HttpStatus.CONFLICT,
      );
    }

    jobEntity.status = JobStatus.COMPLETED;
    await this.jobRepository.updateOne(jobEntity);
  }

  public async isEscrowFunded(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<boolean> {
    if (escrowAddress) {
      const signer = this.web3Service.getSigner(chainId);
      const escrowClient = await EscrowClient.build(signer);
      const balance = await escrowClient.getBalance(escrowAddress);

      return balance !== 0n;
    }

    return false;
  }
}
