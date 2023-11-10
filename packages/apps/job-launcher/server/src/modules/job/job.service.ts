/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  ChainId,
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  NETWORKS,
  StakingClient,
  Encryption,
  EncryptionUtils,
} from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
const { v4: uuidv4 } = require('uuid');
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
import { validate, validateSync } from 'class-validator';
import { BigNumber, ethers } from 'ethers';
import { firstValueFrom } from 'rxjs';
import { LessThanOrEqual, QueryFailedError } from 'typeorm';
import { ConfigNames } from '../../common/config';
import {
  ErrorEscrow,
  ErrorJob,
  ErrorPayment,
  ErrorPostgres,
} from '../../common/constants/errors';
import {
  JobCaptchaMode,
  JobCaptchaRequestType,
  JobCaptchaShapeType,
  JobRequestType,
  JobStatus,
  JobStatusFilter,
} from '../../common/enums/job';
import {
  Currency,
  PaymentSource,
  PaymentStatus,
  PaymentType,
  TokenId,
} from '../../common/enums/payment';
import { isPGPMessage, getRate, hashString, isValidJSON, parseUrl } from '../../common/utils';
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
  HCaptchaManifestDto,
  JobCaptchaAdvancedDto,
  JobCaptchaDto,
  JobCvatDto,
  JobDetailsDto,
  JobFortuneDto,
  JobListDto,
  RestrictedAudience,
  CVATWebhookDto,
  FortuneWebhookDto,
} from './job.dto';
import { JobEntity } from './job.entity';
import { JobRepository } from './job.repository';
import { RoutingProtocolService } from './routing-protocol.service';
import {
  CANCEL_JOB_STATUSES,
  HCAPTCHA_MAX_SHAPES_PER_IMAGE,
  HCAPTCHA_MINIMUM_SELECTION_AREA_PER_SHAPE,
  HCAPTCHA_MIN_SHAPES_PER_IMAGE,
  HEADER_SIGNATURE_KEY,
  JOB_RETRIES_COUNT_THRESHOLD,
} from '../../common/constants';
import { SortDirection } from '../../common/enums/collection';
import { EventType } from '../../common/enums/webhook';
import {
  HMToken,
  HMToken__factory,
} from '@human-protocol/core/typechain-types';
import Decimal from 'decimal.js';
import { EscrowData } from '@human-protocol/sdk/dist/graphql';
import { filterToEscrowStatus } from '../../common/utils/status';
import { signMessage } from '../../common/utils/signature';
import { StorageService } from '../storage/storage.service';
import stringify from 'json-stable-stringify'

@Injectable()
export class JobService {
  public readonly logger = new Logger(JobService.name);

  constructor(
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    public readonly jobRepository: JobRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentService: PaymentService,
    public readonly httpService: HttpService,
    public readonly configService: ConfigService,
    private readonly routingProtocolService: RoutingProtocolService,
    private readonly storageService: StorageService,
  ) {}

  private async createCvatManifest(dto: JobCvatDto, requestType: JobRequestType, tokenFundAmount: number): Promise<CvatManifestDto> {
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

  async createHCaptchaManifest(jobType: JobCaptchaShapeType, jobDto: JobCaptchaDto): Promise<HCaptchaManifestDto> {
    const objectsInBucket = await this.storageService.listObjectsInBucket(jobDto.dataUrl);

    const commonManifestProperties = {
        job_mode: JobCaptchaMode.BATCH,
        requester_accuracy_target: jobDto.accuracyTarget,
        request_config: {},
        requester_max_repeats: jobDto.maxRequests,
        requester_min_repeats: jobDto.minRequests,
        requester_question: { en: jobDto.annotations.labelingPrompt },
        job_total_tasks: objectsInBucket.length,
        task_bid_price: jobDto.annotations.taskBidPrice,
        taskdata_uri: await this.generateAndUploadTaskData(jobDto.dataUrl, objectsInBucket),
        public_results: true,
        oracle_stake: 0.05
    };

    let groundTruthsData;
    if (jobDto.annotations.groundTruths) {
      groundTruthsData = await this.storageService.download(jobDto.annotations.groundTruths)

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
              restricted_audience: {
                sitekey: [
                  {
                    [this.configService.get<number>(ConfigNames.HCAPTCHA_SITE_KEY)!]: {
                      score: 1
                    }
                  }
                ]
              },// this.buildHCaptchaRestrictedAudience(jobDto.advanced),
              requester_restricted_answer_set: {},
              requester_question_example: jobDto.annotations.exampleImages || [],
          };

        case JobCaptchaShapeType.CATEGORAZATION:
          const categorizationManifest = {
              ...commonManifestProperties,
              request_type: JobCaptchaRequestType.IMAGE_LABEL_MULTIPLE_CHOICE,
              groundtruth_uri: jobDto.annotations.groundTruths,
              restricted_audience: {
                sitekey: [
                  {
                    [this.configService.get<number>(ConfigNames.HCAPTCHA_SITE_KEY)!]: {
                      score: 1
                    }
                  }
                ]
              },// this.buildHCaptchaRestrictedAudience(jobDto.advanced),
              requester_restricted_answer_set: {},
              requester_question_example: jobDto.annotations.exampleImages || [],
          };

          categorizationManifest.requester_restricted_answer_set = this.buildHCaptchaRestrictedAnswerSet(groundTruthsData);

          return categorizationManifest;

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
                  min_points: 4,
                  max_points: 4,
                  minimum_selection_area_per_shape: HCAPTCHA_MINIMUM_SELECTION_AREA_PER_SHAPE,
              },
              groundtruth_uri: jobDto.annotations.groundTruths,
              restricted_audience: {
                sitekey: [
                  {
                    [this.configService.get<number>(ConfigNames.HCAPTCHA_SITE_KEY)!]: {
                      score: 1
                    }
                  }
                ]
              },// this.buildHCaptchaRestrictedAudience(jobDto.advanced),
              requester_restricted_answer_set: { [jobDto.annotations.label!]: { en: jobDto.annotations.label } },
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
                  min_points: 1,
                  max_points: 8,
              },
              groundtruth_uri: jobDto.annotations.groundTruths,
              restricted_audience: {
                sitekey: [
                  {
                    [this.configService.get<number>(ConfigNames.HCAPTCHA_SITE_KEY)!]: {
                      score: 1
                    }
                  }
                ]
              },// this.buildHCaptchaRestrictedAudience(jobDto.advanced),
              requester_restricted_answer_set: { [jobDto.annotations.label!]: { en: jobDto.annotations.label } },
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
                  min_points: 4,
                  max_points: 4,
              },
              groundtruth_uri: jobDto.annotations.groundTruths,
              restricted_audience: {
                sitekey: [
                  {
                    [this.configService.get<number>(ConfigNames.HCAPTCHA_SITE_KEY)!]: {
                      score: 1
                    }
                  }
                ]
              },// this.buildHCaptchaRestrictedAudience(jobDto.advanced),
              requester_restricted_answer_set: { [jobDto.annotations.label!]: { en: jobDto.annotations.label } },
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
                  multiple_choice_max_choices:1,
                  multiple_choice_min_choices:1,
                  overlap_threshold: null,
                  answer_type: "str",
                  max_length: 100,
                  min_length: 1
              },
              restricted_audience: {},// this.buildHCaptchaRestrictedAudience(jobDto.advanced),
              requester_restricted_answer_set: { [jobDto.annotations.label!]: { en: jobDto.annotations.label } },
              taskdata: []
          };

          return immoManifest;

        default:
            this.logger.log(ErrorJob.HCaptchaInvalidJobType, JobService.name);
            throw new ConflictException(ErrorJob.HCaptchaInvalidJobType);
    }
  }

  private buildHCaptchaRestrictedAudience(advanced: JobCaptchaAdvancedDto) {
    const restrictedAudience: RestrictedAudience = {};

    if (advanced.workerLanguage) {
        restrictedAudience.lang = [{ [advanced.workerLanguage]: { score: 1 } }];
    }

    if (advanced.workerLocation) {
        restrictedAudience.country = [{ [advanced.workerLocation]: { score: 1 } }];
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

    return outputObject;
  }

  private async generateAndUploadTaskData(dataUrl: string, objectNames: string[]) {
    const data = objectNames.map(objectName => {
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

    if (requestType === JobRequestType.HCAPTCHA) { // hCaptcha
      dto = dto as JobCaptchaDto;
      const objectsInBucket = await this.storageService.listObjectsInBucket(dto.dataUrl);
      fundAmount = div(dto.annotations.taskBidPrice * objectsInBucket.length, rate);
      dto.dataUrl = dto.dataUrl.replace(/\/$/, '')
      
    } else if (requestType === JobRequestType.FORTUNE) { // Fortune
      dto = dto as JobFortuneDto;
      fundAmount = dto.fundAmount;

    } else { // CVAT
      dto = dto as JobCvatDto;
      fundAmount = dto.fundAmount;
    }

    const userBalance = await this.paymentService.getUserBalance(userId);
    const feePercentage = this.configService.get<number>(ConfigNames.JOB_LAUNCHER_FEE)!;
  
    const fee = mul(div(feePercentage, 100), fundAmount);
    const usdTotalAmount = add(fundAmount, fee);
  
    if (lt(userBalance, usdTotalAmount)) {
      this.logger.log(ErrorJob.NotEnoughFunds, JobService.name);
      throw new BadRequestException(ErrorJob.NotEnoughFunds);
    }

    const tokenFundAmount = mul(fundAmount, rate);
    const tokenFee = mul(fee, rate);
    const tokenTotalAmount = add(tokenFundAmount, tokenFee);
  
    if (requestType === JobRequestType.HCAPTCHA) { // hCaptcha
      dto = dto as JobCaptchaDto
  
      manifestOrigin = await this.createHCaptchaManifest(
        dto.annotations.typeOfJob,
        dto
      );

      manifestEncrypted = await EncryptionUtils.encrypt(
        stringify(manifestOrigin), 
        [
          this.configService.get<string>(ConfigNames.PGP_PUBLIC_KEY)!,
          this.configService.get<string>(ConfigNames.HCAPTCHA_PGP_PUBLIC_KEY)!
        ]
      );

    } else if (requestType === JobRequestType.FORTUNE) { // Fortune
      dto = dto as JobFortuneDto;
      manifestOrigin = { ...dto, requestType, fundAmount: tokenTotalAmount };

    } else { // CVAT
      dto = dto as JobCvatDto;
      dto.dataUrl = dto.dataUrl.replace(/\/$/, '')
      manifestOrigin = await this.createCvatManifest(dto, requestType, tokenFundAmount);
    }

    const hash = hashString(stringify(manifestOrigin));
    const { url } = await this.storageService.uploadFile(manifestEncrypted || manifestOrigin, hash)

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

  private async calculateJobBounty(
    endpointUrl: string,
    fundAmount: number,
  ): Promise<string> {
    const totalImages = (await this.storageService.listObjectsInBucket(endpointUrl))
      .length;
    
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
      const encription = await Encryption.build(this.configService.get<string>(ConfigNames.PGP_PRIVATE_KEY)!);
      manifest = await encription.decrypt(manifest as any)
    } 
    
    if (isValidJSON(manifest)) {
      manifest = JSON.parse(manifest);
    }

    await this.validateManifest(manifest);

    let recordingOracleConfigKey;
    let exchangeOracleConfigKey;

    if ((manifest as FortuneManifestDto).requestType === JobRequestType.FORTUNE) {
      recordingOracleConfigKey = ConfigNames.FORTUNE_RECORDING_ORACLE_ADDRESS;
      exchangeOracleConfigKey = ConfigNames.FORTUNE_EXCHANGE_ORACLE_ADDRESS;
    } else if ((manifest as HCaptchaManifestDto).job_mode === JobCaptchaMode.BATCH) {
      recordingOracleConfigKey = ConfigNames.HCAPTCHA_ORACLE_ADDRESS;
      exchangeOracleConfigKey = ConfigNames.HCAPTCHA_ORACLE_ADDRESS;
    } else {
      recordingOracleConfigKey = ConfigNames.CVAT_RECORDING_ORACLE_ADDRESS;
      exchangeOracleConfigKey = ConfigNames.CVAT_EXCHANGE_ORACLE_ADDRESS;
    }

    const escrowConfig = {
      recordingOracle: this.configService.get<string>(recordingOracleConfigKey)!,
      reputationOracle: this.configService.get<string>(ConfigNames.REPUTATION_ORACLE_ADDRESS)!,
      exchangeOracle: this.configService.get<string>(exchangeOracleConfigKey)!,
      recordingOracleFee: BigNumber.from(this.configService.get<number>(ConfigNames.RECORDING_ORACLE_FEE)!),
      reputationOracleFee: BigNumber.from(this.configService.get<number>(ConfigNames.REPUTATION_ORACLE_FEE)!),
      exchangeOracleFee: BigNumber.from(this.configService.get<number>(ConfigNames.EXCHANGE_ORACLE_FEE)!),
      manifestUrl: jobEntity.manifestUrl,
      manifestHash: jobEntity.manifestHash,
    };

    const escrowAddress = await escrowClient.createAndSetupEscrow(
        NETWORKS[jobEntity.chainId as ChainId]!.hmtAddress,
        [],
        jobEntity.userId.toString(),
        escrowConfig,
    );

    if (!escrowAddress) {
        this.logger.log(ErrorEscrow.NotCreated, JobService.name);
        throw new NotFoundException(ErrorEscrow.NotCreated);
    }

    jobEntity.escrowAddress = escrowAddress;
    await jobEntity.save();

    return jobEntity;
  }

  public async fundJob(jobEntity: JobEntity): Promise<JobEntity> {
    const signer = this.web3Service.getSigner(jobEntity.chainId);

    const escrowClient = await EscrowClient.build(signer);

    const weiAmount = ethers.utils.parseUnits(
      jobEntity.fundAmount.toString(),
      'ether',
    );
    await escrowClient.fund(jobEntity.escrowAddress, weiAmount);

    jobEntity.status = JobStatus.LAUNCHED;
    await jobEntity.save();

    return jobEntity;
  }

  public async requestToCancelJob(
    userId: number,
    id: number,
  ): Promise<boolean> {
    const jobEntity = await this.jobRepository.findOne({ id, userId });

    if (!jobEntity) {
      this.logger.log(ErrorJob.NotFound, JobService.name);
      throw new NotFoundException(ErrorJob.NotFound);
    }

    if (!CANCEL_JOB_STATUSES.includes(jobEntity.status)) {
      this.logger.log(ErrorJob.InvalidStatusCancellation, JobService.name);
      throw new ConflictException(ErrorJob.InvalidStatusCancellation);
    }

    jobEntity.status = JobStatus.TO_CANCEL;
    jobEntity.retriesCount = 0;
    await jobEntity.save();

    return true;
  }

  private async validateManifest(
    manifest: FortuneManifestDto | CvatManifestDto | HCaptchaManifestDto,
  ): Promise<boolean> {
    let dtoCheck;

    if ((manifest as FortuneManifestDto).requestType === JobRequestType.FORTUNE) {
      dtoCheck = new FortuneManifestDto()
    } else if ((manifest as HCaptchaManifestDto).job_mode === JobCaptchaMode.BATCH) {
      dtoCheck = new HCaptchaManifestDto()
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

  public async sendWebhook(
    webhookUrl: string,
    webhookData: FortuneWebhookDto | CVATWebhookDto,
    hasSignature: boolean
  ): Promise<boolean> {
    let config = {}
    
    if (hasSignature) {
      const signedBody = await signMessage(
        webhookData,
        this.configService.get(ConfigNames.WEB3_PRIVATE_KEY)!,
      );

      config = {
        headers: { [HEADER_SIGNATURE_KEY]: signedBody },
      }
    }

    const { data } = await firstValueFrom(
      await this.httpService.post(webhookUrl, webhookData, config),
    );

    if (!data) {
      this.logger.log(ErrorJob.WebhookWasNotSent, JobService.name);
      throw new NotFoundException(ErrorJob.WebhookWasNotSent);
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
          jobs = await this.jobRepository.findJobsByStatusFilter(
            networks,
            userId,
            status,
            skip,
            limit,
          );
          break;
        case JobStatusFilter.CANCELED:
        case JobStatusFilter.LAUNCHED:
        case JobStatusFilter.COMPLETED:
          const escrows = await this.findEscrowsByStatus(
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
      console.error(error);
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

  private transformJobs(
    jobs: JobEntity[],
    escrows: EscrowData[] | undefined,
  ): JobListDto[] {
    return jobs.map((job) => ({
      jobId: job.id,
      escrowAddress: job.escrowAddress,
      network: NETWORKS[job.chainId as ChainId]!.title,
      fundAmount: job.fundAmount,
      status: this.mapJobStatus(job, escrows),
    }));
  }

  private mapJobStatus(job: JobEntity, escrows?: EscrowData[]) {
    if (job.status === JobStatus.PAID) {
      return JobStatus.PENDING;
    }

    if (escrows) {
      const escrow = escrows.find(
        (escrow) => escrow.address === job.escrowAddress,
      );
      if (escrow) {
        return (<any>JobStatus)[escrow.status.toUpperCase()];
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

      let allFortuneValidationErrors: ValidationError[] = [];
      
      for (const fortune of result) {
        const fortuneDtoCheck = new FortuneFinalResultDto();
        Object.assign(fortuneDtoCheck, fortune);
        const fortuneValidationErrors: ValidationError[] = await validate(
          fortuneDtoCheck,
        );
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
      return result
    }
    return finalResultUrl;
  }

  public async launchCronJob() {
    try {
      // TODO: Add retry policy and process failure requests https://github.com/humanprotocol/human-protocol/issues/334
      let jobEntity = await this.jobRepository.findOne(
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

      if (!jobEntity) return;

      const manifest = await this.storageService.download(jobEntity.manifestUrl);

      if (!jobEntity.escrowAddress) {
        jobEntity = await this.launchJob(jobEntity);
      }
      if (jobEntity.escrowAddress && jobEntity.status === JobStatus.PAID) {
        jobEntity = await this.fundJob(jobEntity);
      }
      if (jobEntity.escrowAddress && jobEntity.status === JobStatus.LAUNCHED) {
        if ((manifest as CvatManifestDto)?.annotation?.type) {
          await this.sendWebhook(
            this.configService.get<string>(
              ConfigNames.CVAT_EXCHANGE_ORACLE_WEBHOOK_URL,
            )!,
            {
              escrow_address: jobEntity.escrowAddress,
              chain_id: jobEntity.chainId,
              event_type: EventType.ESCROW_CREATED,
            },
            false
          );
        }
      }
    } catch (e) {
      console.log(e);
      this.logger.error(e);
      return;
    }
  }

  public async cancelCronJob() {
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
      const { amountRefunded } = await this.processEscrowCancellation(
        jobEntity,
      );
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
    
    if ((manifest as FortuneManifestDto).requestType === JobRequestType.FORTUNE) {
      await this.sendWebhook(this.configService.get<string>(ConfigNames.FORTUNE_EXCHANGE_ORACLE_WEBHOOK_URL)!, {
        escrowAddress: jobEntity.escrowAddress,
        chainId: jobEntity.chainId,
        eventType: EventType.ESCROW_CANCELED,
      }, true);
    } else {
      await this.sendWebhook(this.configService.get<string>(ConfigNames.CVAT_EXCHANGE_ORACLE_WEBHOOK_URL)!, {
        escrow_address: jobEntity.escrowAddress,
        chain_id: jobEntity.chainId,
        event_type: EventType.ESCROW_CANCELED,
      }, false);
    }

    return true;
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

    return escrowClient.cancel(escrowAddress);
  }

  public async escrowFailedWebhook(
    dto: EscrowFailedWebhookDto,
  ): Promise<boolean> {
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

    return true;
  }

  public async getDetails(
    userId: number,
    jobId: number,
  ): Promise<JobDetailsDto> {
    const jobEntity = await this.jobRepository.findOne({ id: jobId, userId });

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
    }

    const status =
      escrow?.status === 'Completed' ? JobStatus.COMPLETED : jobEntity.status;

    let manifestData = await this.storageService.download(manifestUrl);
    if (!manifestData) {
      throw new NotFoundException(ErrorJob.ManifestNotFound);
    }

    let manifest;
    if (typeof manifestData === 'string' && isPGPMessage(manifestData)) {
      const encription = await Encryption.build(this.configService.get<string>(ConfigNames.PGP_PRIVATE_KEY)!);
      manifestData = await encription.decrypt(manifestData as any)
    } 
    
    if (isValidJSON(manifestData)) {
      manifestData = JSON.parse(manifestData);
    }

    if ((manifestData as FortuneManifestDto).requestType === JobRequestType.FORTUNE) {
      manifest = (manifestData as FortuneManifestDto)
    } else if ((manifestData as HCaptchaManifestDto)?.job_mode === JobCaptchaMode.BATCH) {
      manifest = (manifestData as HCaptchaManifestDto)
    } else {
      manifest = (manifestData as CvatManifestDto)
    }

    const baseManifestDetails = {
      chainId,
      tokenAddress: escrow ? escrow.token : ethers.constants.AddressZero,
      requesterAddress: signer.address,
      fundAmount: escrow ? Number(escrow.totalFundedAmount) : 0,
      exchangeOracleAddress: escrow?.exchangeOracle || ethers.constants.AddressZero,
      recordingOracleAddress: escrow?.recordingOracle || ethers.constants.AddressZero,
      reputationOracleAddress: escrow?.reputationOracle || ethers.constants.AddressZero,
    };

    let specificManifestDetails;
    if ((manifest as FortuneManifestDto).requestType === JobRequestType.FORTUNE) {
      manifest = manifest as FortuneManifestDto;
      specificManifestDetails = {
        title: manifest.requesterTitle,
        description: manifest.requesterDescription,
        requestType: JobRequestType.FORTUNE,
        submissionsRequired: manifest
          .submissionsRequired,
      };
    } else if ((manifest as HCaptchaManifestDto).job_mode === JobCaptchaMode.BATCH) {
      manifest = (manifest as HCaptchaManifestDto);
      specificManifestDetails = {
        requestType: JobRequestType.HCAPTCHA,
        submissionsRequired: manifest.job_total_tasks
      };
    } else {
      manifest = (manifest as CvatManifestDto);
      specificManifestDetails = {
        requestType: manifest.annotation.type,
        submissionsRequired: manifest.annotation
          .job_size,
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
          status,
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
        status,
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
}
