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
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ValidationError,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validate } from 'class-validator';
import { ethers } from 'ethers';
import { In, LessThanOrEqual, QueryFailedError } from 'typeorm';
import { ConfigNames } from '../../common/config';
import {
  ErrorBucket,
  ErrorEscrow,
  ErrorJob,
  ErrorPayment,
  ErrorPostgres,
} from '../../common/constants/errors';
import {
  JobRequestType,
  JobStatus,
  JobStatusFilter,
  JobCaptchaMode,
  JobCaptchaRequestType,
  JobCaptchaShapeType,
} from '../../common/enums/job';
import {
  Currency,
  PaymentSource,
  PaymentStatus,
  PaymentType,
  TokenId,
} from '../../common/enums/payment';
import { isPGPMessage, getRate, isValidJSON } from '../../common/utils';
import { add, div, lt, mul } from '../../common/utils/decimal';
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
} from './job.dto';
import { JobEntity } from './job.entity';
import { JobRepository } from './job.repository';
import { RoutingProtocolService } from './routing-protocol.service';
import {
  CANCEL_JOB_STATUSES,
  DEFAULT_MAX_RETRY_COUNT,
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
import { SortDirection } from '../../common/enums/collection';
import { EventType, OracleType } from '../../common/enums/webhook';
import {
  HMToken,
  HMToken__factory,
} from '@human-protocol/core/typechain-types';
import Decimal from 'decimal.js';
import { EscrowData } from '@human-protocol/sdk/dist/graphql';
import { filterToEscrowStatus } from '../../common/utils/status';
import { StorageService } from '../storage/storage.service';
import { WebhookService } from '../webhook/webhook.service';
import stringify from 'json-stable-stringify';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CronJobService } from '../cron-job/cron-job.service';
import { CronJobType } from '../../common/enums/cron-job';
import {
  generateBucketUrl,
  listObjectsInBucket,
} from '../../common/utils/storage';
import { WebhookDataDto } from '../webhook/webhook.dto';
import * as crypto from 'crypto';

@Injectable()
export class JobService {
  public readonly logger = new Logger(JobService.name);
  public readonly storageParams: StorageParams;
  public readonly bucket: string;

  constructor(
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    public readonly jobRepository: JobRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentService: PaymentService,
    public readonly configService: ConfigService,
    private readonly routingProtocolService: RoutingProtocolService,
    private readonly encryption: Encryption,
    private readonly storageService: StorageService,
    private readonly webhookService: WebhookService,
    private readonly cronJobService: CronJobService,
  ) {}

  public async createCvatManifest(
    dto: JobCvatDto,
    requestType: JobRequestType,
    tokenFundAmount: number,
  ): Promise<CvatManifestDto> {
    const elementsCount = (await listObjectsInBucket(dto.data, requestType))
      .length;
    return {
      data: {
        data_url: generateBucketUrl(dto.data, requestType),
      },
      annotation: {
        labels: dto.labels.map((item) => ({ name: item })),
        description: dto.requesterDescription,
        user_guide: dto.userGuide,
        type: requestType,
        job_size: Number(
          this.configService.get<number>(ConfigNames.CVAT_JOB_SIZE)!,
        ),
        max_time: Number(
          this.configService.get<number>(ConfigNames.CVAT_MAX_TIME)!,
        ),
      },
      validation: {
        min_quality: dto.minQuality,
        val_size: Number(
          this.configService.get<number>(ConfigNames.CVAT_VAL_SIZE)!,
        ),
        gt_url: generateBucketUrl(dto.groundTruth, requestType),
      },
      job_bounty: await this.calculateJobBounty(elementsCount, tokenFundAmount),
    };
  }

  public async createHCaptchaManifest(
    jobType: JobCaptchaShapeType,
    jobDto: JobCaptchaDto,
  ): Promise<HCaptchaManifestDto> {
    const dataUrl = generateBucketUrl(jobDto.data, JobRequestType.HCAPTCHA);
    const objectsInBucket = await listObjectsInBucket(
      jobDto.data,
      JobRequestType.HCAPTCHA,
    );

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
        dataUrl,
        objectsInBucket,
      ),
      public_results: true,
      oracle_stake: HCAPTCHA_ORACLE_STAKE,
      repo_uri: this.configService.get<string>(
        ConfigNames.HCAPTCHA_REPUTATION_ORACLE_URI,
      )!,
      ro_uri: this.configService.get<string>(
        ConfigNames.HCAPTCHA_RECORDING_ORACLE_URI,
      )!,
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
          this.logger.log(ErrorJob.JobParamsValidationFailed, JobService.name);
          throw new BadRequestException(ErrorJob.JobParamsValidationFailed);
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
          this.logger.log(ErrorJob.JobParamsValidationFailed, JobService.name);
          throw new BadRequestException(ErrorJob.JobParamsValidationFailed);
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
          this.logger.log(ErrorJob.JobParamsValidationFailed, JobService.name);
          throw new BadRequestException(ErrorJob.JobParamsValidationFailed);
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
          this.logger.log(ErrorJob.JobParamsValidationFailed, JobService.name);
          throw new BadRequestException(ErrorJob.JobParamsValidationFailed);
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
        this.logger.log(ErrorJob.HCaptchaInvalidJobType, JobService.name);
        throw new ConflictException(ErrorJob.HCaptchaInvalidJobType);
    }
  }

  private buildHCaptchaRestrictedAudience(advanced: JobCaptchaAdvancedDto) {
    const restrictedAudience: RestrictedAudience = {};

    restrictedAudience.sitekey = [
      {
        [this.configService.get<number>(ConfigNames.HCAPTCHA_SITE_KEY)!]: {
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

  public async createJob(
    userId: number,
    requestType: JobRequestType,
    dto: JobFortuneDto | JobCvatDto | JobCaptchaDto,
  ): Promise<number> {
    let { chainId } = dto;

    if (chainId) {
      this.web3Service.validateChainId(chainId);
    } else {
      chainId = this.routingProtocolService.selectNetwork();
    }

    let manifestOrigin, fundAmount;
    const rate = await getRate(Currency.USD, TokenId.HMT);

    if (requestType === JobRequestType.HCAPTCHA) {
      // hCaptcha
      dto = dto as JobCaptchaDto;
      const objectsInBucket = await listObjectsInBucket(
        dto.data,
        JobRequestType.HCAPTCHA,
      );
      fundAmount = div(
        dto.annotations.taskBidPrice * objectsInBucket.length,
        rate,
      );
    } else if (requestType === JobRequestType.FORTUNE) {
      // Fortune
      dto = dto as JobFortuneDto;
      fundAmount = dto.fundAmount;
    } else {
      // CVAT
      dto = dto as JobCvatDto;
      fundAmount = dto.fundAmount;
    }
    const userBalance = await this.paymentService.getUserBalance(userId);
    const feePercentage = Number(await this.getOracleFee(chainId));
    const fee = mul(div(feePercentage, 100), fundAmount);
    const usdTotalAmount = add(fundAmount, fee);

    if (lt(userBalance, usdTotalAmount)) {
      this.logger.log(ErrorJob.NotEnoughFunds, JobService.name);
      throw new BadRequestException(ErrorJob.NotEnoughFunds);
    }

    const tokenFundAmount = mul(fundAmount, rate);
    const tokenFee = mul(fee, rate);
    const tokenTotalAmount = add(tokenFundAmount, tokenFee);

    if (requestType === JobRequestType.HCAPTCHA) {
      // hCaptcha
      dto = dto as JobCaptchaDto;
      manifestOrigin = await this.createHCaptchaManifest(
        dto.annotations.typeOfJob,
        dto,
      );
    } else if (requestType == JobRequestType.FORTUNE) {
      // Fortune
      dto = dto as JobFortuneDto;
      manifestOrigin = { ...dto, requestType, fundAmount: tokenTotalAmount };
    } else {
      // CVAT
      dto = dto as JobCvatDto;
      manifestOrigin = await this.createCvatManifest(
        dto,
        requestType,
        tokenFundAmount,
      );
    }
    const { url, hash } = await this.uploadManifest(manifestOrigin, chainId);

    const jobEntity = await this.jobRepository.create({
      chainId,
      userId,
      manifestUrl: url,
      manifestHash: hash,
      fee: tokenFee,
      fundAmount: tokenFundAmount,
      status: JobStatus.PENDING,
      waitUntil: new Date(),
    });

    if (!jobEntity) {
      this.logger.log(ErrorJob.NotCreated, JobService.name);
      throw new NotFoundException(ErrorJob.NotCreated);
    }

    try {
      await this.paymentRepository.create({
        userId,
        jobId: jobEntity.id,
        source: PaymentSource.BALANCE,
        type: PaymentType.WITHDRAWAL,
        amount: -tokenTotalAmount,
        currency: TokenId.HMT,
        rate: div(1, rate),
        status: PaymentStatus.SUCCEEDED,
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.message.includes(ErrorPostgres.NumericFieldOverflow.toLowerCase())
      ) {
        this.logger.log(ErrorPostgres.NumericFieldOverflow, JobService.name);
        throw new ConflictException(ErrorPayment.IncorrectAmount);
      } else {
        this.logger.log(error, JobService.name);
        throw new ConflictException(ErrorPayment.NotSuccess);
      }
    }

    jobEntity.status = JobStatus.PAID;
    await jobEntity.save();

    return jobEntity.id;
  }

  public async calculateJobBounty(
    elementsCount: number,
    fundAmount: number,
  ): Promise<string> {
    const totalJobs = Math.ceil(
      div(
        elementsCount,
        Number(this.configService.get<number>(ConfigNames.CVAT_JOB_SIZE)!),
      ),
    );

    return ethers.formatEther(
      ethers.parseUnits(fundAmount.toString(), 'ether') / BigInt(totalJobs),
    );
  }

  public async createEscrow(jobEntity: JobEntity): Promise<JobEntity> {
    const signer = this.web3Service.getSigner(jobEntity.chainId);

    const escrowClient = await EscrowClient.build(signer);

    const escrowAddress = await escrowClient.createEscrow(
      NETWORKS[jobEntity.chainId as ChainId]!.hmtAddress,
      [],
      jobEntity.userId.toString(),
      {
        gasPrice: await this.web3Service.calculateGasPrice(jobEntity.chainId),
      },
    );

    if (!escrowAddress) {
      this.logger.log(ErrorEscrow.NotCreated, JobService.name);
      throw new NotFoundException(ErrorEscrow.NotCreated);
    }

    jobEntity.status = JobStatus.CREATED;
    jobEntity.escrowAddress = escrowAddress;
    await jobEntity.save();

    return jobEntity;
  }

  public async setupEscrow(jobEntity: JobEntity): Promise<JobEntity> {
    const signer = this.web3Service.getSigner(jobEntity.chainId);

    const escrowClient = await EscrowClient.build(signer);

    let manifest = await this.storageService.download(jobEntity.manifestUrl);
    if (typeof manifest === 'string' && isPGPMessage(manifest)) {
      const encription = await Encryption.build(
        this.configService.get<string>(ConfigNames.PGP_PRIVATE_KEY)!,
      );
      manifest = await encription.decrypt(manifest as any);
    }

    if (isValidJSON(manifest)) {
      manifest = JSON.parse(manifest);
    }

    await this.validateManifest(manifest);

    const oracleAddresses = this.getOracleAddresses(manifest);

    const escrowConfig = {
      recordingOracle: oracleAddresses.recordingOracle,
      reputationOracle: oracleAddresses.recordingOracle,
      exchangeOracle: oracleAddresses.exchangeOracle,
      recordingOracleFee: await this.getOracleFee(
        jobEntity.chainId,
        oracleAddresses.recordingOracle,
      ),
      reputationOracleFee: await this.getOracleFee(
        jobEntity.chainId,
        oracleAddresses.reputationOracle,
      ),
      exchangeOracleFee: await this.getOracleFee(
        jobEntity.chainId,
        oracleAddresses.exchangeOracle,
      ),
      manifestUrl: jobEntity.manifestUrl,
      manifestHash: jobEntity.manifestHash,
    };

    await escrowClient.setup(jobEntity.escrowAddress, escrowConfig, {
      gasPrice: await this.web3Service.calculateGasPrice(jobEntity.chainId),
    });

    jobEntity.status = JobStatus.SET_UP;
    await jobEntity.save();

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
    await jobEntity.save();

    return jobEntity;
  }

  public async requestToCancelJob(userId: number, id: number): Promise<void> {
    const jobEntity = await this.jobRepository.findOne({ id, userId });

    if (!jobEntity) {
      this.logger.log(ErrorJob.NotFound, JobService.name);
      throw new NotFoundException(ErrorJob.NotFound);
    }

    if (!CANCEL_JOB_STATUSES.includes(jobEntity.status)) {
      this.logger.log(ErrorJob.InvalidStatusCancellation, JobService.name);
      throw new ConflictException(ErrorJob.InvalidStatusCancellation);
    }

    if (
      jobEntity.status === JobStatus.PENDING ||
      jobEntity.status === JobStatus.PAID
    ) {
      await this.paymentService.createRefundPayment({
        refundAmount: jobEntity.fundAmount,
        userId: jobEntity.userId,
        jobId: jobEntity.id,
      });
      jobEntity.status = JobStatus.CANCELED;
    } else {
      jobEntity.status = JobStatus.TO_CANCEL;
    }
    jobEntity.retriesCount = 0;
    await jobEntity.save();
  }

  private getOracleAddresses(manifest: any) {
    let recordingOracleConfigKey;
    let exchangeOracleConfigKey;
    const oracleType = this.getOracleType(manifest);
    if (oracleType === OracleType.FORTUNE) {
      recordingOracleConfigKey = ConfigNames.FORTUNE_RECORDING_ORACLE_ADDRESS;
      exchangeOracleConfigKey = ConfigNames.FORTUNE_EXCHANGE_ORACLE_ADDRESS;
    } else if (oracleType === OracleType.HCAPTCHA) {
      recordingOracleConfigKey = ConfigNames.HCAPTCHA_ORACLE_ADDRESS;
      exchangeOracleConfigKey = ConfigNames.HCAPTCHA_ORACLE_ADDRESS;
    } else {
      recordingOracleConfigKey = ConfigNames.CVAT_RECORDING_ORACLE_ADDRESS;
      exchangeOracleConfigKey = ConfigNames.CVAT_EXCHANGE_ORACLE_ADDRESS;
    }

    const exchangeOracle = this.configService.get<string>(
      exchangeOracleConfigKey,
    )!;
    const recordingOracle = this.configService.get<string>(
      recordingOracleConfigKey,
    )!;
    const reputationOracle = this.configService.get<string>(
      ConfigNames.REPUTATION_ORACLE_ADDRESS,
    )!;

    return { exchangeOracle, recordingOracle, reputationOracle };
  }

  public async uploadManifest(
    manifest: FortuneManifestDto | CvatManifestDto | HCaptchaManifestDto,
    chainId: ChainId,
  ): Promise<any> {
    let manifestFile: any = manifest;
    if (this.configService.get(ConfigNames.PGP_ENCRYPT)) {
      const signer = this.web3Service.getSigner(chainId);
      const kvstore = await KVStoreClient.build(signer);
      const publicKeys: string[] = [
        await kvstore.get(signer.address, KVStoreKeys.publicKey),
      ];
      const oracleAddresses = this.getOracleAddresses(
        (manifest as FortuneManifestDto).requestType,
      );
      for (const address in Object.values(oracleAddresses)) {
        const publicKey = await kvstore.get(address, KVStoreKeys.publicKey);
        if (publicKey) publicKeys.push(publicKey);
      }

      const encryptedManifest = await this.encryption.signAndEncrypt(
        JSON.stringify(manifest),
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
      this.logger.log(ErrorBucket.UnableSaveFile, JobService.name);
      throw new BadRequestException(ErrorBucket.UnableSaveFile);
    }

    return uploadedFile;
  }

  private async validateManifest(
    manifest: FortuneManifestDto | CvatManifestDto | HCaptchaManifestDto,
  ): Promise<boolean> {
    let dtoCheck;

    if (
      (manifest as FortuneManifestDto).requestType === JobRequestType.FORTUNE
    ) {
      dtoCheck = new FortuneManifestDto();
    } else if (
      (manifest as HCaptchaManifestDto).job_mode === JobCaptchaMode.BATCH
    ) {
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
      throw new NotFoundException(ErrorJob.ManifestValidationFailed);
    }

    return true;
  }

  public async getJobsByStatus(
    networks: ChainId[],
    userId: number,
    status?: JobStatusFilter,
    skip = 0,
    limit = 10,
  ): Promise<JobListDto[] | BadRequestException> {
    try {
      let jobs: JobEntity[] = [];
      let escrows: EscrowData[] | undefined;

      networks.forEach((chainId) =>
        this.web3Service.validateChainId(Number(chainId)),
      );

      switch (status) {
        case JobStatusFilter.FAILED:
        case JobStatusFilter.PENDING:
        case JobStatusFilter.CANCELED:
          jobs = await this.jobRepository.findJobsByStatusFilter(
            networks,
            userId,
            status,
            skip,
            limit,
          );
          break;
        case JobStatusFilter.LAUNCHED:
        case JobStatusFilter.COMPLETED:
          escrows = await this.findEscrowsByStatus(
            networks,
            userId,
            status,
            skip,
            limit,
          );
          const escrowAddresses = escrows.map((escrow) =>
            ethers.getAddress(escrow.address),
          );

          jobs = await this.jobRepository.findJobsByEscrowAddresses(
            userId,
            escrowAddresses,
          );
          break;
      }

      return this.transformJobs(jobs, escrows);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private async findEscrowsByStatus(
    networks: ChainId[],
    userId: number,
    status: JobStatusFilter,
    skip: number,
    limit: number,
  ): Promise<EscrowData[]> {
    const escrows: EscrowData[] = [];
    const statuses = filterToEscrowStatus(status);

    for (const escrowStatus of statuses) {
      escrows.push(
        ...(await EscrowUtils.getEscrows({
          networks,
          jobRequesterId: userId.toString(),
          status: escrowStatus,
          launcher: this.web3Service.signerAddress,
        })),
      );
    }

    if (statuses.length > 1) {
      escrows.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
    }

    return escrows.slice(skip, limit);
  }

  private async transformJobs(
    jobs: JobEntity[],
    escrows: EscrowData[] | undefined,
  ): Promise<JobListDto[]> {
    const jobPromises = jobs.map(async (job) => {
      return {
        jobId: job.id,
        escrowAddress: job.escrowAddress,
        network: NETWORKS[job.chainId as ChainId]!.title,
        fundAmount: job.fundAmount,
        status: await this.mapJobStatus(job, escrows),
      };
    });

    return Promise.all(jobPromises);
  }

  private async mapJobStatus(job: JobEntity, escrows?: EscrowData[]) {
    if (job.status === JobStatus.PAID) {
      return JobStatus.PENDING;
    }

    if (escrows) {
      const escrow = escrows.find(
        (escrow) =>
          escrow.address.toLowerCase() === job.escrowAddress.toLowerCase(),
      );
      if (escrow) {
        const newJob = await this.updateCompletedStatus(job, escrow);
        return newJob.status;
      }
    }

    return job.status;
  }

  public async getResult(
    userId: number,
    jobId: number,
  ): Promise<FortuneFinalResultDto[] | string> {
    const jobEntity = await this.jobRepository.findOne({
      id: jobId,
      userId,
    });
    if (!jobEntity) {
      this.logger.log(ErrorJob.NotFound, JobService.name);
      throw new NotFoundException(ErrorJob.NotFound);
    }

    const signer = this.web3Service.getSigner(jobEntity.chainId);
    const escrowClient = await EscrowClient.build(signer);

    const finalResultUrl = await escrowClient.getResultsUrl(
      jobEntity.escrowAddress,
    );

    if (!finalResultUrl) {
      this.logger.log(ErrorJob.ResultNotFound, JobService.name);
      throw new NotFoundException(ErrorJob.ResultNotFound);
    }

    const manifest = await this.storageService.download(jobEntity.manifestUrl);
    if (
      (manifest as FortuneManifestDto).requestType === JobRequestType.FORTUNE
    ) {
      const result = await this.storageService.download(finalResultUrl);

      if (!result) {
        throw new NotFoundException(ErrorJob.ResultNotFound);
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
        throw new NotFoundException(ErrorJob.ResultValidationFailed);
      }
      return result;
    }
    return finalResultUrl;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  public async createEscrowCronJob() {
    const isCronJobRunning = await this.cronJobService.isCronJobRunning(
      CronJobType.CreateEscrow,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.log('Create escrow START');
    const cronJob = await this.cronJobService.startCronJob(
      CronJobType.CreateEscrow,
    );

    try {
      const jobEntities = await this.jobRepository.find(
        {
          status: In([JobStatus.PAID]),
          retriesCount: LessThanOrEqual(
            this.configService.get(
              ConfigNames.MAX_RETRY_COUNT,
              DEFAULT_MAX_RETRY_COUNT,
            ),
          ),
          waitUntil: LessThanOrEqual(new Date()),
        },
        {
          order: {
            waitUntil: SortDirection.ASC,
          },
        },
      );

      for (const jobEntity of jobEntities) {
        try {
          await this.createEscrow(jobEntity);
        } catch (err) {
          this.logger.error(`Error creating escrow: ${err.message}`);
          await this.handleProcessJobFailure(jobEntity);
        }
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Create escrow STOP');
    await this.cronJobService.completeCronJob(cronJob);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  public async setupEscrowCronJob() {
    const isCronJobRunning = await this.cronJobService.isCronJobRunning(
      CronJobType.SetupEscrow,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.log('Setup escrow START');
    const cronJob = await this.cronJobService.startCronJob(
      CronJobType.SetupEscrow,
    );

    try {
      const jobEntities = await this.jobRepository.find(
        {
          status: JobStatus.CREATED,
          retriesCount: LessThanOrEqual(
            this.configService.get(
              ConfigNames.MAX_RETRY_COUNT,
              DEFAULT_MAX_RETRY_COUNT,
            ),
          ),
          waitUntil: LessThanOrEqual(new Date()),
        },
        {
          order: {
            waitUntil: SortDirection.ASC,
          },
        },
      );

      for (const jobEntity of jobEntities) {
        try {
          await this.setupEscrow(jobEntity);
        } catch (err) {
          this.logger.error(`Error setting up escrow: ${err.message}`);
          await this.handleProcessJobFailure(jobEntity);
        }
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Setup escrow STOP');
    await this.cronJobService.completeCronJob(cronJob);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  public async fundEscrowCronJob() {
    const isCronJobRunning = await this.cronJobService.isCronJobRunning(
      CronJobType.FundEscrow,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.log('Fund escrow START');
    const cronJob = await this.cronJobService.startCronJob(
      CronJobType.FundEscrow,
    );

    try {
      const jobEntities = await this.jobRepository.find(
        {
          status: JobStatus.SET_UP,
          retriesCount: LessThanOrEqual(
            this.configService.get(
              ConfigNames.MAX_RETRY_COUNT,
              DEFAULT_MAX_RETRY_COUNT,
            ),
          ),
          waitUntil: LessThanOrEqual(new Date()),
        },
        {
          order: {
            waitUntil: SortDirection.ASC,
          },
        },
      );

      for (const jobEntity of jobEntities) {
        try {
          await this.fundEscrow(jobEntity);

          const manifest = await this.storageService.download(
            jobEntity.manifestUrl,
          );

          if ((manifest as CvatManifestDto)?.annotation?.type) {
            await this.webhookService.createWebhook({
              escrowAddress: jobEntity.escrowAddress,
              chainId: jobEntity.chainId,
              eventType: EventType.ESCROW_CREATED,
              oracleType: OracleType.CVAT,
              hasSignature: false,
            });
          }
        } catch (err) {
          this.logger.error(`Error funding escrow: ${err.message}`);
          await this.handleProcessJobFailure(jobEntity);
        }
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('Fund escrow STOP');
    await this.cronJobService.completeCronJob(cronJob);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  public async cancelCronJob() {
    const isCronJobRunning = await this.cronJobService.isCronJobRunning(
      CronJobType.FundEscrow,
    );

    if (isCronJobRunning) {
      return;
    }

    this.logger.log('Cancel jobs START');
    const cronJob = await this.cronJobService.startCronJob(
      CronJobType.CancelEscrow,
    );

    try {
      const jobEntities = await this.jobRepository.find(
        {
          status: JobStatus.TO_CANCEL,
          retriesCount: LessThanOrEqual(
            this.configService.get(
              ConfigNames.MAX_RETRY_COUNT,
              DEFAULT_MAX_RETRY_COUNT,
            ),
          ),
          waitUntil: LessThanOrEqual(new Date()),
        },
        {
          order: {
            waitUntil: SortDirection.ASC,
          },
        },
      );

      for (const jobEntity of jobEntities) {
        try {
          if (jobEntity.escrowAddress) {
            const { amountRefunded } =
              await this.processEscrowCancellation(jobEntity);
            await this.paymentService.createRefundPayment({
              refundAmount: Number(ethers.formatEther(amountRefunded)),
              userId: jobEntity.userId,
              jobId: jobEntity.id,
            });
          } else {
            await this.paymentService.createRefundPayment({
              refundAmount: jobEntity.fundAmount,
              userId: jobEntity.userId,
              jobId: jobEntity.id,
            });
          }
          jobEntity.status = JobStatus.CANCELED;
          await jobEntity.save();

          const manifest = await this.storageService.download(
            jobEntity.manifestUrl,
          );

          const oracleType = this.getOracleType(manifest);
          if (oracleType !== OracleType.HCAPTCHA) {
            await this.webhookService.createWebhook({
              escrowAddress: jobEntity.escrowAddress,
              chainId: jobEntity.chainId,
              eventType: EventType.ESCROW_CANCELED,
              oracleType: this.getOracleType(manifest),
              hasSignature:
                (manifest as FortuneManifestDto).requestType ===
                JobRequestType.FORTUNE,
            });
          }
        } catch (err) {
          this.logger.error(`Error canceling escrow: ${err.message}`);
          await this.handleProcessJobFailure(jobEntity);
        }
      }
    } catch (e) {
      this.logger.error(e);
    }
    await this.cronJobService.completeCronJob(cronJob);
    this.logger.log('Cancel jobs STOP');
    return true;
  }

  private handleProcessJobFailure = async (jobEntity: JobEntity) => {
    if (
      jobEntity.retriesCount <
      this.configService.get(
        ConfigNames.MAX_RETRY_COUNT,
        DEFAULT_MAX_RETRY_COUNT,
      )
    ) {
      jobEntity.retriesCount += 1;
    } else {
      jobEntity.status = JobStatus.FAILED;
    }

    await jobEntity.save();
  };

  private getOracleType(manifest: any): OracleType {
    if (
      (manifest as FortuneManifestDto)?.requestType === JobRequestType.FORTUNE
    ) {
      return OracleType.FORTUNE;
    } else if (
      (manifest as CvatManifestDto)?.annotation?.type ===
        JobRequestType.IMAGE_BOXES ||
      (manifest as CvatManifestDto)?.annotation?.type ===
        JobRequestType.IMAGE_POINTS
    ) {
      return OracleType.CVAT;
    }
    return OracleType.HCAPTCHA;
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
      this.logger.log(ErrorEscrow.InvalidStatusCancellation, JobService.name);
      throw new BadRequestException(ErrorEscrow.InvalidStatusCancellation);
    }

    const balance = await escrowClient.getBalance(escrowAddress);
    if (balance === 0n) {
      this.logger.log(ErrorEscrow.InvalidBalanceCancellation, JobService.name);
      throw new BadRequestException(ErrorEscrow.InvalidBalanceCancellation);
    }

    return escrowClient.cancel(escrowAddress, {
      gasPrice: await this.web3Service.calculateGasPrice(chainId),
    });
  }

  public async escrowFailedWebhook(dto: WebhookDataDto): Promise<void> {
    if (dto.eventType !== EventType.TASK_CREATION_FAILED) {
      this.logger.log(ErrorJob.InvalidEventType, JobService.name);
      throw new BadRequestException(ErrorJob.InvalidEventType);
    }

    const jobEntity = await this.jobRepository.findOne({
      chainId: dto.chainId,
      escrowAddress: dto.escrowAddress,
    });

    if (!jobEntity) {
      this.logger.log(ErrorJob.NotFound, JobService.name);
      throw new NotFoundException(ErrorJob.NotFound);
    }

    if (jobEntity.status !== JobStatus.LAUNCHED) {
      this.logger.log(ErrorJob.NotLaunched, JobService.name);
      throw new ConflictException(ErrorJob.NotLaunched);
    }

    jobEntity.status = JobStatus.FAILED;
    jobEntity.failedReason = dto.reason!;
    await jobEntity.save();
  }

  public async getDetails(
    userId: number,
    jobId: number,
  ): Promise<JobDetailsDto> {
    let jobEntity = await this.jobRepository.findOne({ id: jobId, userId });

    if (!jobEntity) {
      this.logger.log(ErrorJob.NotFound, JobService.name);
      throw new NotFoundException(ErrorJob.NotFound);
    }

    const { chainId, escrowAddress, manifestUrl, manifestHash } = jobEntity;
    const signer = this.web3Service.getSigner(chainId);

    let escrow, allocation;

    if (escrowAddress) {
      const stakingClient = await StakingClient.build(signer);

      escrow = await EscrowUtils.getEscrow(chainId, escrowAddress);
      allocation = await stakingClient.getAllocation(escrowAddress);
      jobEntity = await this.updateCompletedStatus(jobEntity, escrow);
    }

    let manifestData = await this.storageService.download(manifestUrl);

    if (!manifestData) {
      throw new NotFoundException(ErrorJob.ManifestNotFound);
    }

    let manifest;
    if (typeof manifestData === 'string' && isPGPMessage(manifestData)) {
      const encription = await Encryption.build(
        this.configService.get<string>(ConfigNames.PGP_PRIVATE_KEY)!,
      );
      manifestData = await encription.decrypt(manifestData as any);
    }

    if (isValidJSON(manifestData)) {
      manifestData = JSON.parse(manifestData);
    }

    if (
      (manifestData as FortuneManifestDto).requestType ===
      JobRequestType.FORTUNE
    ) {
      manifest = manifestData as FortuneManifestDto;
    } else if (
      (manifestData as HCaptchaManifestDto)?.job_mode === JobCaptchaMode.BATCH
    ) {
      manifest = manifestData as HCaptchaManifestDto;
    } else {
      manifest = manifestData as CvatManifestDto;
    }

    const baseManifestDetails = {
      chainId,
      tokenAddress: escrow ? escrow.token : ethers.ZeroAddress,
      requesterAddress: signer.address,
      fundAmount: escrow ? Number(escrow.totalFundedAmount) : 0,
      exchangeOracleAddress: escrow?.exchangeOracle || ethers.ZeroAddress,
      recordingOracleAddress: escrow?.recordingOracle || ethers.ZeroAddress,
      reputationOracleAddress: escrow?.reputationOracle || ethers.ZeroAddress,
    };

    let specificManifestDetails;
    if (
      (manifest as FortuneManifestDto).requestType === JobRequestType.FORTUNE
    ) {
      manifest = manifest as FortuneManifestDto;
      specificManifestDetails = {
        title: manifest.requesterTitle,
        description: manifest.requesterDescription,
        requestType: JobRequestType.FORTUNE,
        submissionsRequired: manifest.submissionsRequired,
      };
    } else if (
      (manifest as HCaptchaManifestDto).job_mode === JobCaptchaMode.BATCH
    ) {
      manifest = manifest as HCaptchaManifestDto;
      specificManifestDetails = {
        requestType: JobRequestType.HCAPTCHA,
        submissionsRequired: manifest.job_total_tasks,
      };
    } else {
      manifest = manifest as CvatManifestDto;
      specificManifestDetails = {
        requestType: manifest.annotation.type,
        submissionsRequired: manifest.annotation.job_size,
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
        paidOut: Number(escrow?.amountPaid || 0),
        status: jobEntity.status,
      },
      manifest: manifestDetails,
      staking: {
        staker: allocation?.staker as string,
        allocated: Number(allocation?.tokens),
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
    chainId: ChainId,
    oracleAddress?: string,
  ): Promise<bigint> {
    const signer = this.web3Service.getSigner(chainId);

    const kvStoreClient = await KVStoreClient.build(signer);

    const feeValue = await kvStoreClient.get(
      oracleAddress || signer.address,
      KVStoreKeys.fee,
    );

    return BigInt(feeValue ? feeValue : 1);
  }

  private async updateCompletedStatus(
    job: JobEntity,
    escrow: EscrowData,
  ): Promise<JobEntity> {
    let updatedJob = job;
    if (
      escrow.status === EscrowStatus[EscrowStatus.Complete] &&
      job.status !== JobStatus.COMPLETED
    )
      updatedJob = await this.jobRepository.updateOne(
        { id: job.id },
        { status: JobStatus.COMPLETED },
      );
    return updatedJob;
  }
}
