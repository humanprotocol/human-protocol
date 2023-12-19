/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  ChainId,
  EscrowClient,
  EscrowStatus,
  KVStoreClient,
  EscrowUtils,
  NETWORKS,
  StakingClient,
  StorageClient,
  KVStoreKeys,
  Encryption,
  EncryptionUtils,
} from '@human-protocol/sdk';
import { v4 as uuidv4 } from 'uuid';
import {
  BadGatewayException,
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
import { BigNumber, ethers } from 'ethers';
import { IsNull, LessThanOrEqual, Not, QueryFailedError } from 'typeorm';
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
import {
  isPGPMessage,
  getRate,
  hashString,
  isValidJSON,
} from '../../common/utils';
import { add, div, lt, mul } from '../../common/utils/decimal';
import { PaymentRepository } from '../payment/payment.repository';
import { PaymentService } from '../payment/payment.service';
import { Web3Service } from '../web3/web3.service';
import {
  CvatManifestDto,
  EscrowCancelDto,
  EscrowFailedWebhookDto,
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
  JOB_RETRIES_COUNT_THRESHOLD,
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

@Injectable()
export class JobService {
  public readonly logger = new Logger(JobService.name);

  constructor(
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    public readonly jobRepository: JobRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentService: PaymentService,
    public readonly configService: ConfigService,
    private readonly routingProtocolService: RoutingProtocolService,
    private readonly storageService: StorageService,
    private readonly webhookService: WebhookService,
  ) {}

  public async createCvatManifest(
    dto: JobCvatDto,
    requestType: JobRequestType,
    tokenFundAmount: number,
  ): Promise<CvatManifestDto> {
    return {
      data: {
        data_url: dto.dataUrl,
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
        gt_url: dto.gtUrl,
      },
      job_bounty: await this.calculateJobBounty(dto.dataUrl, tokenFundAmount),
    };
  }

  public async createHCaptchaManifest(
    jobType: JobCaptchaShapeType,
    jobDto: JobCaptchaDto,
  ): Promise<HCaptchaManifestDto> {
    const objectsInBucket = await this.storageService.listObjectsInBucket(
      jobDto.dataUrl,
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
        jobDto.dataUrl,
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

    const hash = hashString(stringify(data));
    const { url } = await this.storageService.uploadFile(data, hash);
    return url;
  }

  public async createJob(
    userId: number,
    requestType: JobRequestType,
    dto: JobFortuneDto | JobCvatDto | JobCaptchaDto,
  ): Promise<number> {
    const { chainId } = dto;

    if (chainId) {
      this.web3Service.validateChainId(chainId);
    }

    let manifestOrigin, manifestEncrypted, fundAmount;
    const rate = await getRate(Currency.USD, TokenId.HMT);

    if (requestType === JobRequestType.HCAPTCHA) {
      // hCaptcha
      dto = dto as JobCaptchaDto;
      const objectsInBucket = await this.storageService.listObjectsInBucket(
        dto.dataUrl,
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
    const feePercentage = this.configService.get<number>(
      ConfigNames.JOB_LAUNCHER_FEE,
    )!;
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
      dto.dataUrl = dto.dataUrl.replace(/\/$/, '');
      manifestOrigin = await this.createHCaptchaManifest(
        dto.annotations.typeOfJob,
        dto,
      );

      manifestEncrypted = await EncryptionUtils.encrypt(
        stringify(manifestOrigin),
        [
          this.configService.get<string>(ConfigNames.PGP_PUBLIC_KEY)!,
          this.configService.get<string>(ConfigNames.HCAPTCHA_PGP_PUBLIC_KEY)!,
        ],
      );
    } else if (requestType == JobRequestType.FORTUNE) {
      // Fortune
      dto = dto as JobFortuneDto;
      manifestOrigin = { ...dto, requestType, fundAmount: tokenTotalAmount };
    } else {
      // CVAT
      dto = dto as JobCvatDto;
      dto.dataUrl = dto.dataUrl.replace(/\/$/, '');
      manifestOrigin = await this.createCvatManifest(
        dto,
        requestType,
        tokenFundAmount,
      );
    }
    const hash = hashString(stringify(manifestOrigin));
    const { url } = await this.storageService.uploadFile(
      manifestEncrypted || manifestOrigin,
      hash,
    );

    const jobEntity = await this.jobRepository.create({
      chainId: chainId ?? this.routingProtocolService.selectNetwork(),
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
    endpointUrl: string,
    fundAmount: number,
  ): Promise<string> {
    const totalImages = (
      await this.storageService.listObjectsInBucket(endpointUrl)
    ).length;

    const totalJobs = Math.ceil(
      div(
        totalImages,
        Number(this.configService.get<number>(ConfigNames.CVAT_JOB_SIZE)!),
      ),
    );

    return ethers.utils.formatEther(
      ethers.utils.parseUnits(fundAmount.toString(), 'ether').div(totalJobs),
    );
  }

  public async launchJob(jobEntity: JobEntity): Promise<JobEntity> {
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

    let recordingOracleConfigKey;
    let exchangeOracleConfigKey;
    let trustedHandlers;

    if (
      (manifest as FortuneManifestDto).requestType === JobRequestType.FORTUNE
    ) {
      recordingOracleConfigKey = ConfigNames.FORTUNE_RECORDING_ORACLE_ADDRESS;
      exchangeOracleConfigKey = ConfigNames.FORTUNE_EXCHANGE_ORACLE_ADDRESS;
    } else if (
      (manifest as HCaptchaManifestDto).job_mode === JobCaptchaMode.BATCH
    ) {
      recordingOracleConfigKey = ConfigNames.HCAPTCHA_ORACLE_ADDRESS;
      exchangeOracleConfigKey = ConfigNames.HCAPTCHA_ORACLE_ADDRESS;
    } else {
      recordingOracleConfigKey = ConfigNames.CVAT_RECORDING_ORACLE_ADDRESS;
      exchangeOracleConfigKey = ConfigNames.CVAT_EXCHANGE_ORACLE_ADDRESS;
    }

    const recordingOracleAddress = this.configService.get<string>(
      recordingOracleConfigKey,
    )!;

    const reputationOracleAddress = this.configService.get<string>(
      ConfigNames.REPUTATION_ORACLE_ADDRESS,
    )!;

    const exchangeOracleAddress = this.configService.get<string>(
      exchangeOracleConfigKey,
    )!;
    const escrowConfig = {
      recordingOracle: recordingOracleAddress,
      reputationOracle: recordingOracleAddress,
      exchangeOracle: exchangeOracleAddress,
      recordingOracleFee: await this.getOracleFee(
        recordingOracleAddress,
        jobEntity.chainId,
      ),
      reputationOracleFee: await this.getOracleFee(
        reputationOracleAddress,
        jobEntity.chainId,
      ),
      exchangeOracleFee: await this.getOracleFee(
        exchangeOracleAddress,
        jobEntity.chainId,
      ),
      manifestUrl: jobEntity.manifestUrl,
      manifestHash: jobEntity.manifestHash,
    };

    jobEntity.status = JobStatus.LAUNCHING;
    await jobEntity.save();

    const escrowAddress = await escrowClient.createEscrow(
      NETWORKS[jobEntity.chainId as ChainId]!.hmtAddress,
      [],
      jobEntity.userId.toString(),
      {
        gasPrice: await this.web3Service.calculateGasPrice(jobEntity.chainId),
      },
    );

    await escrowClient.setup(escrowAddress, escrowConfig, {
      gasPrice: await this.web3Service.calculateGasPrice(jobEntity.chainId),
    });

    if (!escrowAddress) {
      this.logger.log(ErrorEscrow.NotCreated, JobService.name);
      throw new NotFoundException(ErrorEscrow.NotCreated);
    }

    jobEntity.escrowAddress = escrowAddress;
    await jobEntity.save();

    return jobEntity;
  }

  public async fundJob(jobEntity: JobEntity): Promise<JobEntity> {
    jobEntity.status = JobStatus.FUNDING;
    await jobEntity.save();

    const signer = this.web3Service.getSigner(jobEntity.chainId);

    const escrowClient = await EscrowClient.build(signer);

    const weiAmount = ethers.utils.parseUnits(
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
            ethers.utils.getAddress(escrow.address),
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
  public async launchCronJob() {
    this.logger.log('Launch jobs START');
    try {
      // TODO: Add retry policy and process failure requests https://github.com/humanprotocol/human-protocol/issues/334
      let jobEntity;

      jobEntity = await this.jobRepository.findOne(
        {
          status: JobStatus.LAUNCHING,
          retriesCount: LessThanOrEqual(JOB_RETRIES_COUNT_THRESHOLD),
          waitUntil: LessThanOrEqual(new Date()),
          escrowAddress: Not(IsNull()),
        },
        {
          order: {
            waitUntil: SortDirection.ASC,
          },
        },
      );

      if (!jobEntity) {
        jobEntity = await this.jobRepository.findOne(
          {
            status: JobStatus.PAID,
            retriesCount: LessThanOrEqual(JOB_RETRIES_COUNT_THRESHOLD),
            waitUntil: LessThanOrEqual(new Date()),
          },
          {
            order: {
              waitUntil: SortDirection.ASC,
            },
          },
        );
      }

      if (!jobEntity) return;

      const manifest = await this.storageService.download(
        jobEntity.manifestUrl,
      );

      if (!jobEntity.escrowAddress && jobEntity.status === JobStatus.PAID) {
        jobEntity = await this.launchJob(jobEntity);
      }
      if (jobEntity.escrowAddress && jobEntity.status === JobStatus.LAUNCHING) {
        jobEntity = await this.fundJob(jobEntity);
      }
      if (jobEntity.escrowAddress && jobEntity.status === JobStatus.LAUNCHED) {
        if ((manifest as CvatManifestDto)?.annotation?.type) {
          await this.webhookService.createWebhook({
            escrowAddress: jobEntity.escrowAddress,
            chainId: jobEntity.chainId,
            eventType: EventType.ESCROW_CREATED,
            oracleType: OracleType.CVAT,
            hasSignature: false,
          });
        }
      }
    } catch (e) {
      this.logger.error(e);
      return;
    }
    this.logger.log('Launch jobs STOP');
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  public async cancelCronJob() {
    this.logger.log('Cancel jobs START');
    const jobEntity = await this.jobRepository.findOne(
      {
        status: JobStatus.TO_CANCEL,
        retriesCount: LessThanOrEqual(JOB_RETRIES_COUNT_THRESHOLD),
        waitUntil: LessThanOrEqual(new Date()),
      },
      {
        order: {
          waitUntil: SortDirection.ASC,
        },
      },
    );
    if (!jobEntity) return;

    if (jobEntity.escrowAddress) {
      const { amountRefunded } =
        await this.processEscrowCancellation(jobEntity);
      await this.paymentService.createRefundPayment({
        refundAmount: Number(ethers.utils.formatEther(amountRefunded)),
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

    const manifest = await this.storageService.download(jobEntity.manifestUrl);

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

    this.logger.log('Cancel jobs STOP');
    return true;
  }

  private getOracleType(manifest: any): OracleType {
    if (
      (manifest as FortuneManifestDto).requestType === JobRequestType.FORTUNE
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
    if (balance.eq(0)) {
      this.logger.log(ErrorEscrow.InvalidBalanceCancellation, JobService.name);
      throw new BadRequestException(ErrorEscrow.InvalidBalanceCancellation);
    }

    return escrowClient.cancel(escrowAddress, {
      gasPrice: await this.web3Service.calculateGasPrice(chainId),
    });
  }

  public async escrowFailedWebhook(dto: EscrowFailedWebhookDto): Promise<void> {
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
    jobEntity.failedReason = dto.reason;
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
      tokenAddress: escrow ? escrow.token : ethers.constants.AddressZero,
      requesterAddress: signer.address,
      fundAmount: escrow ? Number(escrow.totalFundedAmount) : 0,
      exchangeOracleAddress:
        escrow?.exchangeOracle || ethers.constants.AddressZero,
      recordingOracleAddress:
        escrow?.recordingOracle || ethers.constants.AddressZero,
      reputationOracleAddress:
        escrow?.reputationOracle || ethers.constants.AddressZero,
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
          escrowAddress: ethers.constants.AddressZero,
          manifestUrl,
          manifestHash,
          balance: 0,
          paidOut: 0,
          status: jobEntity.status,
        },
        manifest: manifestDetails,
        staking: {
          staker: ethers.constants.AddressZero,
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
        balance: Number(ethers.utils.formatEther(escrow?.balance || 0)),
        paidOut: Number(escrow?.amountPaid || 0),
        status: jobEntity.status,
      },
      manifest: manifestDetails,
      staking: {
        staker: allocation?.staker as string,
        allocated: allocation?.tokens.toNumber() as number,
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
      topics: [ethers.utils.id('Transfer(address,address,uint256)')],
      fromBlock: fromBlock,
      toBlock: toBlock,
    };

    return signer.provider.getLogs(filter);
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

    logs.forEach((log) => {
      const parsedLog = tokenContract.interface.parseLog(log);
      const from = parsedLog.args[0];
      const amount = parsedLog.args[2];

      if (from === escrowAddress) {
        paidOutAmount = paidOutAmount.add(ethers.utils.formatEther(amount));
      }
    });

    return Number(paidOutAmount);
  }

  private async getOracleFee(
    oracleAddress: string,
    chainId: ChainId,
  ): Promise<BigNumber> {
    const signer = this.web3Service.getSigner(chainId);

    const kvStoreClient = await KVStoreClient.build(signer);

    const feeValue = await kvStoreClient.get(oracleAddress, KVStoreKeys.fee);

    return BigNumber.from(feeValue ? feeValue : 1);
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
