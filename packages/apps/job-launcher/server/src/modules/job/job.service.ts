/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  ChainId,
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  NETWORKS,
  StakingClient,
  StorageClient,
  StorageCredentials,
  StorageParams,
  UploadFile,
} from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
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
import { firstValueFrom } from 'rxjs';
import { LessThanOrEqual, QueryFailedError } from 'typeorm';
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
} from '../../common/enums/job';
import {
  Currency,
  PaymentSource,
  PaymentStatus,
  PaymentType,
  TokenId,
} from '../../common/enums/payment';
import { getRate, parseUrl } from '../../common/utils';
import { add, div, lt, mul } from '../../common/utils/decimal';
import { PaymentRepository } from '../payment/payment.repository';
import { PaymentService } from '../payment/payment.service';
import { Web3Service } from '../web3/web3.service';
import {
  CvatFinalResultDto,
  CvatManifestDto,
  EscrowCancelDto,
  EscrowFailedWebhookDto,
  FortuneFinalResultDto,
  FortuneManifestDto,
  JobCvatDto,
  JobDetailsDto,
  JobFortuneDto,
  JobListDto,
  SaveManifestDto,
  CVATWebhookDto,
  FortuneWebhookDto,
} from './job.dto';
import { JobEntity } from './job.entity';
import { JobRepository } from './job.repository';
import { RoutingProtocolService } from './routing-protocol.service';
import {
  CANCEL_JOB_STATUSES,
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

@Injectable()
export class JobService {
  public readonly logger = new Logger(JobService.name);
  public readonly storageClient: StorageClient;
  public readonly storageParams: StorageParams;
  public readonly bucket: string;

  constructor(
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    public readonly jobRepository: JobRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentService: PaymentService,
    public readonly httpService: HttpService,
    public readonly configService: ConfigService,
    private readonly routingProtocolService: RoutingProtocolService,
  ) {
    const storageCredentials: StorageCredentials = {
      accessKey: this.configService.get<string>(ConfigNames.S3_ACCESS_KEY)!,
      secretKey: this.configService.get<string>(ConfigNames.S3_SECRET_KEY)!,
    };

    const useSSL =
      this.configService.get<string>(ConfigNames.S3_USE_SSL) === 'true';
    this.storageParams = {
      endPoint: this.configService.get<string>(ConfigNames.S3_ENDPOINT)!,
      port: Number(this.configService.get<number>(ConfigNames.S3_PORT)!),
      useSSL,
    };

    this.bucket = this.configService.get<string>(ConfigNames.S3_BUCKET)!;

    this.storageClient = new StorageClient(
      this.storageParams,
      storageCredentials,
    );
  }

  public async createJob(
    userId: number,
    requestType: JobRequestType,
    dto: JobFortuneDto | JobCvatDto,
  ): Promise<number> {
    let manifestUrl, manifestHash;
    const { chainId, fundAmount } = dto;

    if (chainId) {
      this.web3Service.validateChainId(chainId);
    }

    const userBalance = await this.paymentService.getUserBalance(userId);

    const rate = await getRate(Currency.USD, TokenId.HMT);

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

    if (requestType == JobRequestType.FORTUNE) {
      ({ manifestUrl, manifestHash } = await this.saveManifest({
        ...(dto as JobFortuneDto),
        requestType,
        fundAmount: tokenFundAmount,
      }));
    } else {
      dto = dto as JobCvatDto;
      ({ manifestUrl, manifestHash } = await this.saveManifest({
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
      }));
    }

    const jobEntity = await this.jobRepository.create({
      chainId: chainId ?? this.routingProtocolService.selectNetwork(),
      userId,
      manifestUrl,
      manifestHash,
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
    const storageData = parseUrl(endpointUrl);

    if (!storageData.bucket) {
      throw new BadRequestException(ErrorBucket.NotExist);
    }

    const storageClient = new StorageClient({
      endPoint: storageData.endPoint,
      port: storageData.port,
      useSSL: storageData.useSSL,
      region: storageData.region
    });

    const totalImages = (await storageClient.listObjects(storageData.bucket))
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

    const manifest = await this.getManifest(jobEntity.manifestUrl);

    const recordingOracleConfigKey =
      (manifest as FortuneManifestDto).requestType === JobRequestType.FORTUNE
        ? ConfigNames.FORTUNE_RECORDING_ORACLE_ADDRESS
        : ConfigNames.CVAT_RECORDING_ORACLE_ADDRESS;

    const exchangeOracleConfigKey =
      (manifest as FortuneManifestDto).requestType === JobRequestType.FORTUNE
        ? ConfigNames.FORTUNE_EXCHANGE_ORACLE_ADDRESS
        : ConfigNames.CVAT_EXCHANGE_ORACLE_ADDRESS;

    const escrowConfig = {
      recordingOracle: this.configService.get<string>(
        recordingOracleConfigKey,
      )!,
      reputationOracle: this.configService.get<string>(
        ConfigNames.REPUTATION_ORACLE_ADDRESS,
      )!,
      exchangeOracle: this.configService.get<string>(exchangeOracleConfigKey)!,
      recordingOracleFee: BigNumber.from(
        this.configService.get<number>(ConfigNames.RECORDING_ORACLE_FEE)!,
      ),
      reputationOracleFee: BigNumber.from(
        this.configService.get<number>(ConfigNames.REPUTATION_ORACLE_FEE)!,
      ),
      exchangeOracleFee: BigNumber.from(
        this.configService.get<number>(ConfigNames.EXCHANGE_ORACLE_FEE)!,
      ),
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

  public async saveManifest(
    manifest: FortuneManifestDto | CvatManifestDto,
  ): Promise<SaveManifestDto> {
    const uploadedFiles: UploadFile[] = await this.storageClient.uploadFiles(
      [manifest],
      this.bucket,
    );

    if (!uploadedFiles[0]) {
      this.logger.log(ErrorBucket.UnableSaveFile, JobService.name);
      throw new BadGatewayException(ErrorBucket.UnableSaveFile);
    }

    const { url, hash } = uploadedFiles[0];
    const manifestUrl = url;

    return { manifestUrl, manifestHash: hash };
  }

  private async validateManifest(
    manifest: FortuneManifestDto | CvatManifestDto,
  ): Promise<boolean> {
    const dtoCheck =
      (manifest as FortuneManifestDto).requestType == JobRequestType.FORTUNE
        ? new FortuneManifestDto()
        : new CvatManifestDto();

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

  public async getManifest(
    manifestUrl: string,
  ): Promise<FortuneManifestDto | CvatManifestDto> {
    const manifest = await StorageClient.downloadFileFromUrl(manifestUrl);

    if (!manifest) {
      throw new NotFoundException(ErrorJob.ManifestNotFound);
    }

    return manifest;
  }

  public async sendWebhook(
    webhookUrl: string,
    webhookData: FortuneWebhookDto | CVATWebhookDto,
  ): Promise<boolean> {
    const signedBody = await signMessage(
      webhookData,
      this.configService.get(ConfigNames.WEB3_PRIVATE_KEY)!,
    );
    const { data } = await firstValueFrom(
      await this.httpService.post(webhookUrl, webhookData, {
        headers: { [HEADER_SIGNATURE_KEY]: signedBody },
      }),
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
  ): Promise<FortuneFinalResultDto | CvatFinalResultDto> {
    const jobEntity = await this.jobRepository.findOne({
      id: jobId,
      userId,
      status: JobStatus.LAUNCHED,
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

    const result = await StorageClient.downloadFileFromUrl(finalResultUrl);

    if (!result) {
      throw new NotFoundException(ErrorJob.ResultNotFound);
    }

    const fortuneDtoCheck = new FortuneFinalResultDto();
    const imageLabelBinaryDtoCheck = new CvatFinalResultDto();

    Object.assign(fortuneDtoCheck, result);
    Object.assign(imageLabelBinaryDtoCheck, result);

    const fortuneValidationErrors: ValidationError[] = await validate(
      fortuneDtoCheck,
    );
    const imageLabelBinaryValidationErrors: ValidationError[] = await validate(
      imageLabelBinaryDtoCheck,
    );
    if (
      fortuneValidationErrors.length > 0 &&
      imageLabelBinaryValidationErrors.length > 0
    ) {
      this.logger.log(
        ErrorJob.ResultValidationFailed,
        JobService.name,
        fortuneValidationErrors,
        imageLabelBinaryValidationErrors,
      );
      throw new NotFoundException(ErrorJob.ResultValidationFailed);
    }

    return result;
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

      const manifest = await this.getManifest(jobEntity.manifestUrl);
      await this.validateManifest(manifest);

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

    const manifest = await this.getManifest(jobEntity.manifestUrl);
    
    if ((manifest as FortuneManifestDto).requestType === JobRequestType.FORTUNE) {
      await this.sendWebhook(this.configService.get<string>(ConfigNames.FORTUNE_EXCHANGE_ORACLE_WEBHOOK_URL)!, {
        escrowAddress: jobEntity.escrowAddress,
        chainId: jobEntity.chainId,
        eventType: EventType.ESCROW_CANCELED,
      });
    } else {
      await this.sendWebhook(this.configService.get<string>(ConfigNames.CVAT_EXCHANGE_ORACLE_WEBHOOK_URL)!, {
        escrow_address: jobEntity.escrowAddress,
        chain_id: jobEntity.chainId,
        event_type: EventType.ESCROW_CANCELED,
      });
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

    const manifestData = await this.getManifest(manifestUrl);
    if (!manifestData) {
      throw new NotFoundException(ErrorJob.ManifestNotFound);
    }

    const manifest =
      (manifestData as FortuneManifestDto).requestType ===
      JobRequestType.FORTUNE
        ? (manifestData as FortuneManifestDto)
        : (manifestData as CvatManifestDto);

    const baseManifestDetails = {
      chainId,
      tokenAddress: escrow ? escrow.token : ethers.constants.AddressZero,
      fundAmount: escrow ? Number(escrow.totalFundedAmount) : 0,
      requesterAddress: signer.address,
      exchangeOracleAddress: escrow?.exchangeOracle,
      recordingOracleAddress: escrow?.recordingOracle,
      reputationOracleAddress: escrow?.reputationOracle,
    };

    const specificManifestDetails =
      (manifest as FortuneManifestDto).requestType === JobRequestType.FORTUNE
        ? {
            title: (manifest as FortuneManifestDto).requesterTitle,
            description: (manifest as FortuneManifestDto).requesterDescription,
            requestType: JobRequestType.FORTUNE,
            submissionsRequired: (manifest as FortuneManifestDto)
              .submissionsRequired,
          }
        : {
            requestType: (manifest as CvatManifestDto).annotation.type,
            submissionsRequired: (manifest as CvatManifestDto).annotation
              .job_size,
          };

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
