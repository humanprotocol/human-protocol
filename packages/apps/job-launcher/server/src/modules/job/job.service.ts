/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  ChainId,
  EscrowClient,
  EscrowStatus,
  KVStoreClient,
  EscrowUtils,
  NETWORKS,
  StakingClient,
  StorageParams,
  Encryption,
  KVStoreKeys,
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
} from '../../common/constants/errors';
import {
  JobRequestType,
  JobStatus,
  JobCaptchaMode,
  JobCaptchaRequestType,
  JobCaptchaShapeType,
  JobCurrency,
} from '../../common/enums/job';
import {
  Currency,
  PaymentSource,
  PaymentStatus,
  PaymentType,
  TokenId,
} from '../../common/enums/payment';
import { isPGPMessage, isValidJSON, parseUrl } from '../../common/utils';
import { add, div, lt, mul, max } from '../../common/utils/decimal';
import { PaymentRepository } from '../payment/payment.repository';
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
} from './job.dto';
import { JobEntity } from './job.entity';
import { JobRepository } from './job.repository';
import { RoutingProtocolService } from './routing-protocol.service';
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
import stringify from 'json-stable-stringify';
import {
  generateBucketUrl,
  listObjectsInBucket,
} from '../../common/utils/storage';
import { WebhookDataDto } from '../webhook/webhook.dto';
import * as crypto from 'crypto';
import { PaymentEntity } from '../payment/payment.entity';
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
import { RateService } from '../payment/rate.service';
import { PageDto } from '../../common/pagination/pagination.dto';
import { CronJobType } from '../../common/enums/cron-job';
import { CronJobRepository } from '../cron-job/cron-job.repository';
import { ModuleRef } from '@nestjs/core';

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
    private readonly paymentRepository: PaymentRepository,
    private readonly serverConfigService: ServerConfigService,
    private readonly authConfigService: AuthConfigService,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly cvatConfigService: CvatConfigService,
    private readonly pgpConfigService: PGPConfigService,
    private readonly routingProtocolService: RoutingProtocolService,
    private readonly storageService: StorageService,
    private readonly rateService: RateService,
    private moduleRef: ModuleRef,
    @Inject(Encryption) private readonly encryption: Encryption,
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
    };

    let groundTruthsData;
    if (jobDto.annotations.groundTruths) {
      groundTruthsData = await this.storageService.download(
        jobDto.annotations.groundTruths,
      );

      if (isValidJSON(groundTruthsData)) {
        groundTruthsData = JSON.parse(groundTruthsData);
      }
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

    const hash = crypto
      .createHash('sha1')
      .update(stringify(data))
      .digest('hex');
    const { url } = await this.storageService.uploadFile(data, hash);
    return url;
  }

  private createJobSpecificActions: Record<JobRequestType, RequestAction> = {
    [JobRequestType.HCAPTCHA]: {
      calculateFundAmount: async (dto: JobCaptchaDto, rate: number) => {
        const dataUrl = generateBucketUrl(dto.data, JobRequestType.HCAPTCHA);
        const objectsInBucket = await listObjectsInBucket(dataUrl);
        return div(dto.annotations.taskBidPrice * objectsInBucket.length, rate);
      },
      createManifest: (dto: JobCaptchaDto) => this.createHCaptchaManifest(dto),
    },
    [JobRequestType.FORTUNE]: {
      calculateFundAmount: async (dto: JobFortuneDto) => dto.fundAmount,
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
    [JobRequestType.IMAGE_BOXES]: {
      calculateFundAmount: async (dto: JobCvatDto) => dto.fundAmount,
      createManifest: (
        dto: JobCvatDto,
        requestType: JobRequestType,
        fundAmount: number,
      ) => this.createCvatManifest(dto, requestType, fundAmount),
    },
    [JobRequestType.IMAGE_POINTS]: {
      calculateFundAmount: async (dto: JobCvatDto) => dto.fundAmount,
      createManifest: (
        dto: JobCvatDto,
        requestType: JobRequestType,
        fundAmount: number,
      ) => this.createCvatManifest(dto, requestType, fundAmount),
    },
    [JobRequestType.IMAGE_BOXES_FROM_POINTS]: {
      calculateFundAmount: async (dto: JobCvatDto) => dto.fundAmount,
      createManifest: (
        dto: JobCvatDto,
        requestType: JobRequestType,
        fundAmount: number,
      ) => this.createCvatManifest(dto, requestType, fundAmount),
    },
    [JobRequestType.IMAGE_SKELETONS_FROM_BOXES]: {
      calculateFundAmount: async (dto: JobCvatDto) => dto.fundAmount,
      createManifest: (
        dto: JobCvatDto,
        requestType: JobRequestType,
        fundAmount: number,
      ) => this.createCvatManifest(dto, requestType, fundAmount),
    },
  };

  private createEscrowSpecificActions: Record<JobRequestType, EscrowAction> = {
    [JobRequestType.HCAPTCHA]: {
      getTrustedHandlers: () => [],
    },
    [JobRequestType.FORTUNE]: {
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
    [JobRequestType.IMAGE_BOXES]: {
      getElementsCount: async (urls: GenerateUrls) => {
        const gt = await this.storageService.download(
          `${urls.gtUrl.protocol}//${urls.gtUrl.host}${urls.gtUrl.pathname}`,
        );
        const data = await listObjectsInBucket(urls.dataUrl);

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
        const gt = await this.storageService.download(
          `${urls.gtUrl.protocol}//${urls.gtUrl.host}${urls.gtUrl.pathname}`,
        );
        const data = await listObjectsInBucket(urls.dataUrl);

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
    userId: number,
    requestType: JobRequestType,
    dto: CreateJob,
  ): Promise<number> {
    let { chainId } = dto;

    if (chainId) {
      this.web3Service.validateChainId(chainId);
    } else {
      chainId = this.routingProtocolService.selectNetwork();
    }

    const rate = await this.rateService.getRate(Currency.USD, TokenId.HMT);
    const { calculateFundAmount, createManifest } =
      this.createJobSpecificActions[requestType];

    const userBalance = await this.paymentService.getUserBalance(
      userId,
      div(1, rate),
    );
    const feePercentage = Number(
      await this.getOracleFee(
        await this.web3Service.getOperatorAddress(),
        chainId,
      ),
    );

    let tokenFee, tokenTotalAmount, tokenFundAmount, usdTotalAmount;

    if (dto instanceof JobQuickLaunchDto) {
      tokenFee = mul(div(feePercentage, 100), dto.fundAmount);
      tokenFundAmount = dto.fundAmount;
      tokenTotalAmount = add(tokenFundAmount, tokenFee);
      usdTotalAmount = div(tokenTotalAmount, rate);
    } else if (
      (dto instanceof JobFortuneDto || dto instanceof JobCvatDto) &&
      dto.currency === JobCurrency.HMT
    ) {
      tokenFundAmount = dto.fundAmount;
      const fundAmountInUSD = div(tokenFundAmount, rate);
      const feeInUSD = max(
        this.serverConfigService.minimunFeeUsd,
        mul(div(feePercentage, 100), fundAmountInUSD),
      );
      tokenFee = mul(feeInUSD, rate);
      tokenTotalAmount = add(tokenFundAmount, tokenFee);
      usdTotalAmount = add(fundAmountInUSD, feeInUSD);
    } else {
      const fundAmount = await calculateFundAmount(dto, rate);
      const fee = max(
        this.serverConfigService.minimunFeeUsd,
        mul(div(feePercentage, 100), fundAmount),
      );

      tokenFundAmount = mul(fundAmount, rate);
      tokenFee = mul(fee, rate);
      tokenTotalAmount = add(tokenFundAmount, tokenFee);
      usdTotalAmount = add(fundAmount, fee);
    }

    if (lt(userBalance, usdTotalAmount)) {
      throw new ControlledError(
        ErrorJob.NotEnoughFunds,
        HttpStatus.BAD_REQUEST,
      );
    }

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
        tokenFundAmount,
      );

      const { url, hash } = await this.uploadManifest(
        requestType,
        chainId,
        manifestOrigin,
      );

      jobEntity.manifestUrl = url;
      jobEntity.manifestHash = hash;
    }

    jobEntity.chainId = chainId;
    jobEntity.userId = userId;
    jobEntity.requestType = requestType;
    jobEntity.fee = tokenFee;
    jobEntity.fundAmount = tokenFundAmount;
    jobEntity.status = JobStatus.PENDING;
    jobEntity.waitUntil = new Date();

    jobEntity = await this.jobRepository.createUnique(jobEntity);

    const paymentEntity = new PaymentEntity();
    paymentEntity.userId = userId;
    paymentEntity.jobId = jobEntity.id;
    paymentEntity.source = PaymentSource.BALANCE;
    paymentEntity.type = PaymentType.WITHDRAWAL;
    if (
      (dto instanceof JobFortuneDto || dto instanceof JobCvatDto) &&
      dto.currency === JobCurrency.USD
    ) {
      paymentEntity.amount = -usdTotalAmount;
      paymentEntity.currency = JobCurrency.USD;
      paymentEntity.rate = 1;
    } else {
      paymentEntity.amount = -tokenTotalAmount;
      paymentEntity.currency = TokenId.HMT;
      paymentEntity.rate = div(1, rate);
    }
    paymentEntity.status = PaymentStatus.SUCCEEDED;

    await this.paymentRepository.createUnique(paymentEntity);

    jobEntity.status = JobStatus.PAID;
    await this.jobRepository.updateOne(jobEntity);

    return jobEntity.id;
  }

  public async getCvatElementsCount(gtUrl: URL, dataUrl: URL): Promise<number> {
    const data = await this.storageService.download(dataUrl.href);
    const gt = await this.storageService.download(gtUrl.href);

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
      NETWORKS[jobEntity.chainId as ChainId]!.hmtAddress,
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

    let manifest = await this.storageService.download(jobEntity.manifestUrl);
    if (typeof manifest === 'string' && isPGPMessage(manifest)) {
      manifest = await this.encryption.decrypt(manifest as any);
    }

    if (isValidJSON(manifest)) {
      manifest = JSON.parse(manifest);
    }

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

    jobEntity.status = JobStatus.SET_UP;
    await this.jobRepository.updateOne(jobEntity);

    return jobEntity;
  }

  public async fundEscrow(jobEntity: JobEntity): Promise<JobEntity> {
    const signer = this.web3Service.getSigner(jobEntity.chainId);

    const escrowClient = await EscrowClient.build(signer);

    const weiAmount = ethers.parseUnits(
      jobEntity.fundAmount.toString(),
      'ether',
    );
    await escrowClient.fund(jobEntity.escrowAddress, weiAmount, {
      gasPrice: await this.web3Service.calculateGasPrice(jobEntity.chainId),
    });

    jobEntity.status = JobStatus.LAUNCHED;
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
      case JobStatus.PENDING:
        break;
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
      case JobStatus.SET_UP:
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
      const kvstore = await KVStoreClient.build(signer);
      const publicKeys: string[] = [await kvstore.getPublicKey(signer.address)];
      const oracleAddresses = getOracleAddresses();
      for (const address of Object.values(oracleAddresses)) {
        const publicKey = await kvstore.getPublicKey(address);
        if (publicKey) publicKeys.push(publicKey);
      }

      const encryptedManifest = await this.encryption.signAndEncrypt(
        JSON.stringify(data),
        publicKeys,
      );
      manifestFile = encryptedManifest;
    }

    const hash = crypto
      .createHash('sha1')
      .update(stringify(manifestFile))
      .digest('hex');
    const uploadedFile = await this.storageService.uploadFile(
      manifestFile,
      hash,
    );

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
      const result = await this.storageService.download(finalResultUrl);

      if (!result) {
        throw new ControlledError(
          ErrorJob.ResultNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const allFortuneValidationErrors: ValidationError[] = [];

      for (const fortune of result) {
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
      return result;
    }
    return finalResultUrl;
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
    if (
      dto.eventType !== EventType.ESCROW_FAILED &&
      dto.eventType !== EventType.TASK_CREATION_FAILED
    ) {
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

    let escrow, allocation;

    if (escrowAddress) {
      const stakingClient = await StakingClient.build(signer);

      escrow = await EscrowUtils.getEscrow(chainId, escrowAddress);
      allocation = await stakingClient.getAllocation(escrowAddress);
    }

    let manifestData = await this.storageService.download(manifestUrl);

    if (!manifestData) {
      throw new ControlledError(
        ErrorJob.ManifestNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    let manifest;
    if (typeof manifestData === 'string' && isPGPMessage(manifestData)) {
      manifestData = await this.encryption.decrypt(manifestData as any);
    }

    if (isValidJSON(manifestData)) {
      manifestData = JSON.parse(manifestData);
    }

    if (jobEntity.requestType === JobRequestType.FORTUNE) {
      manifest = manifestData as FortuneManifestDto;
    } else if (jobEntity.requestType === JobRequestType.HCAPTCHA) {
      manifest = manifestData as HCaptchaManifestDto;
    } else {
      manifest = manifestData as CvatManifestDto;
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
      manifest = manifest as FortuneManifestDto;
      specificManifestDetails = {
        title: manifest.requesterTitle,
        description: manifest.requesterDescription,
        requestType: JobRequestType.FORTUNE,
        submissionsRequired: manifest.submissionsRequired,
      };
    } else if (jobEntity.requestType === JobRequestType.HCAPTCHA) {
      manifest = manifest as HCaptchaManifestDto;
      specificManifestDetails = {
        requestType: JobRequestType.HCAPTCHA,
        submissionsRequired: manifest.job_total_tasks,
      };
    } else {
      manifest = manifest as CvatManifestDto;
      specificManifestDetails = {
        requestType: manifest.annotation?.type,
        submissionsRequired: manifest.annotation?.job_size,
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
        staking: {
          staker: ethers.ZeroAddress,
          allocated: 0,
          slashed: 0,
        },
      };
    }

    return {
      details: {
        escrowAddress,
        manifestUrl,
        manifestHash,
        balance: Number(ethers.formatEther(escrow?.balance || 0)),
        paidOut: Number(ethers.formatEther(escrow?.amountPaid || 0)),
        status: jobEntity.status,
        failedReason: jobEntity.failedReason,
      },
      manifest: manifestDetails,
      staking: {
        staker: allocation?.staker as string,
        allocated: Number(ethers.formatEther(allocation?.tokens || 0)),
        slashed: 0, // TODO: Retrieve slash tokens
      },
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
    const signer = this.web3Service.getSigner(chainId);

    const kvStoreClient = await KVStoreClient.build(signer);

    const feeValue = await kvStoreClient.get(oracleAddress, KVStoreKeys.fee);

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
    if (jobEntity.status !== JobStatus.LAUNCHED) {
      throw new ControlledError(ErrorJob.NotLaunched, HttpStatus.CONFLICT);
    }

    jobEntity.status = JobStatus.COMPLETED;
    await this.jobRepository.updateOne(jobEntity);
  }
}
