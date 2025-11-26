import {
  ChainId,
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  ICancellationRefund,
  KVStoreKeys,
  KVStoreUtils,
  NETWORKS,
} from '@human-protocol/sdk';
import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  ValidationError as ClassValidationError,
  validate,
} from 'class-validator';
import { ethers } from 'ethers';
import { ServerConfigService } from '../../common/config/server-config.service';
import { CANCEL_JOB_STATUSES } from '../../common/constants';
import {
  ErrorEscrow,
  ErrorJob,
  ErrorPayment,
  ErrorQualification,
} from '../../common/constants/errors';
import { TOKEN_ADDRESSES } from '../../common/constants/tokens';
import { CronJobType } from '../../common/enums/cron-job';
import {
  AudinoJobType,
  CvatJobType,
  EscrowFundToken,
  FortuneJobType,
  HCaptchaJobType,
  JobRequestType,
  JobStatus,
} from '../../common/enums/job';
import {
  FiatCurrency,
  PaymentCurrency,
  PaymentType,
} from '../../common/enums/payment';
import { EventType, OracleType } from '../../common/enums/webhook';
import {
  ConflictError,
  NotFoundError,
  ServerError,
  ValidationError,
} from '../../common/errors';
import { PageDto } from '../../common/pagination/pagination.dto';
import { parseUrl } from '../../common/utils';
import { add, div, max, mul } from '../../common/utils/decimal';
import { getTokenDecimals } from '../../common/utils/tokens';
import logger from '../../logger';
import { CronJobRepository } from '../cron-job/cron-job.repository';
import {
  AudinoManifestDto,
  CvatManifestDto,
  FortuneManifestDto,
  HCaptchaManifestDto,
} from '../manifest/manifest.dto';
import { ManifestService } from '../manifest/manifest.service';
import { PaymentService } from '../payment/payment.service';
import { QualificationService } from '../qualification/qualification.service';
import { RateService } from '../rate/rate.service';
import { RoutingProtocolService } from '../routing-protocol/routing-protocol.service';
import { StorageService } from '../storage/storage.service';
import { UserEntity } from '../user/user.entity';
import { Web3Service } from '../web3/web3.service';
import { WebhookDataDto } from '../webhook/webhook.dto';
import { WebhookRepository } from '../webhook/webhook.repository';
import { WhitelistService } from '../whitelist/whitelist.service';
import {
  CreateJob,
  FortuneFinalResultDto,
  GetJobsDto,
  JobDetailsDto,
  JobListDto,
  JobQuickLaunchDto,
} from './job.dto';
import { JobEntity } from './job.entity';
import { JobRepository } from './job.repository';
import { Escrow, Escrow__factory } from '@human-protocol/core/typechain-types';

@Injectable()
export class JobService {
  private readonly logger = logger.child({ context: JobService.name });
  public readonly bucket: string;
  private cronJobRepository: CronJobRepository;

  constructor(
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    private readonly jobRepository: JobRepository,
    private readonly webhookRepository: WebhookRepository,
    private readonly paymentService: PaymentService,
    private readonly serverConfigService: ServerConfigService,
    private readonly routingProtocolService: RoutingProtocolService,
    private readonly storageService: StorageService,
    private readonly rateService: RateService,
    private readonly whitelistService: WhitelistService,
    private moduleRef: ModuleRef,
    private readonly qualificationService: QualificationService,
    private readonly manifestService: ManifestService,
  ) {}

  onModuleInit() {
    this.cronJobRepository = this.moduleRef.get(CronJobRepository, {
      strict: false,
    });
  }

  public async createJob(
    user: UserEntity,
    requestType: JobRequestType,
    dto: CreateJob,
  ): Promise<number> {
    // DISABLE HMT
    if (
      requestType !== HCaptchaJobType.HCAPTCHA &&
      dto.chainId !== ChainId.LOCALHOST &&
      (dto.escrowFundToken === EscrowFundToken.HMT ||
        dto.paymentCurrency === PaymentCurrency.HMT)
    ) {
      throw new ValidationError(ErrorPayment.HMTTokenDisabled);
    }

    let { chainId, reputationOracle, exchangeOracle, recordingOracle } = dto;

    // Select network
    chainId = chainId || this.routingProtocolService.selectNetwork();
    this.web3Service.validateChainId(chainId);

    // Check if not whitelisted user has an active payment method
    const whitelisted = await this.whitelistService.isUserWhitelisted(user.id);
    if (!whitelisted) {
      if (
        !user.paymentProviderId ||
        !(await this.paymentService.getDefaultPaymentMethod(
          user.paymentProviderId,
        ))
      )
        throw new ValidationError(ErrorJob.NotActiveCard);
    }

    const feePercentage = Number(
      await this.getOracleFee(
        await this.web3Service.getOperatorAddress(),
        chainId,
      ),
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
          throw new ValidationError(ErrorQualification.InvalidQualification);
        }
      });
    }

    let jobEntity = new JobEntity();

    if (dto instanceof JobQuickLaunchDto) {
      if (!dto.manifestHash) {
        const { filename } = parseUrl(dto.manifestUrl);

        if (!filename) {
          throw new ValidationError(ErrorJob.ManifestHashNotExist);
        }

        jobEntity.manifestHash = filename;
      } else {
        jobEntity.manifestHash = dto.manifestHash;
      }

      jobEntity.manifestUrl = dto.manifestUrl;
    } else {
      const manifestOrigin = await this.manifestService.createManifest(
        dto,
        requestType,
        fundTokenAmount,
        fundTokenDecimals,
      );

      const { url, hash } = await this.manifestService.uploadManifest(
        chainId,
        manifestOrigin,
        [exchangeOracle, reputationOracle, recordingOracle],
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
      (
        [
          AudinoJobType.AUDIO_TRANSCRIPTION,
          AudinoJobType.AUDIO_ATTRIBUTE_ANNOTATION,
          FortuneJobType.FORTUNE,
          HCaptchaJobType.HCAPTCHA,
        ] as JobRequestType[]
      ).includes(requestType)
    ) {
      jobEntity.status = JobStatus.MODERATION_PASSED;
    } else {
      jobEntity.status = JobStatus.PAID;
    }

    jobEntity = await this.jobRepository.updateOne(jobEntity);

    return jobEntity.id;
  }

  public async createEscrow(jobEntity: JobEntity): Promise<JobEntity> {
    const signer = this.web3Service.getSigner(jobEntity.chainId);

    const escrowClient = await EscrowClient.build(signer);

    const token = (TOKEN_ADDRESSES[jobEntity.chainId as ChainId] ?? {})[
      jobEntity.token as EscrowFundToken
    ]!;

    const weiAmount = ethers.parseUnits(
      jobEntity.fundAmount.toString(),
      token.decimals,
    );

    const escrowConfig = {
      recordingOracle: jobEntity.recordingOracle,
      recordingOracleFee: await this.getOracleFee(
        jobEntity.recordingOracle,
        jobEntity.chainId,
      ),
      reputationOracle: jobEntity.reputationOracle,
      reputationOracleFee: await this.getOracleFee(
        jobEntity.reputationOracle,
        jobEntity.chainId,
      ),
      exchangeOracle: jobEntity.exchangeOracle,
      exchangeOracleFee: await this.getOracleFee(
        jobEntity.exchangeOracle,
        jobEntity.chainId,
      ),
      manifest: jobEntity.manifestUrl,
      manifestHash: jobEntity.manifestHash,
    };

    await this.web3Service.ensureEscrowAllowance(
      jobEntity.chainId,
      token,
      weiAmount,
      NETWORKS[jobEntity.chainId as ChainId]!.factoryAddress,
    );

    const escrowAddress = await escrowClient.createFundAndSetupEscrow(
      token.address,
      weiAmount,
      jobEntity.userId.toString(),
      escrowConfig,
      {
        gasPrice: await this.web3Service.calculateGasPrice(jobEntity.chainId),
      },
    );

    if (!escrowAddress) {
      throw new ConflictError(ErrorEscrow.NotCreated);
    }

    jobEntity.status = JobStatus.LAUNCHED;
    jobEntity.escrowAddress = escrowAddress;
    await this.jobRepository.updateOne(jobEntity);

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
      throw new NotFoundError(ErrorJob.NotFound);
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
      throw new NotFoundError(ErrorJob.NotFound);
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
      throw new ConflictError(ErrorJob.InvalidStatusCancellation);
    }

    if (jobEntity.status === JobStatus.PAID) {
      if (await this.isCronJobRunning(CronJobType.CreateEscrow)) {
        throw new ConflictError(ErrorJob.CancelWhileProcessing);
      }
    }

    jobEntity.status = JobStatus.TO_CANCEL;

    jobEntity.retriesCount = 0;
    await this.jobRepository.updateOne(jobEntity);
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
          escrowAddress: job.escrowAddress ?? undefined,
          network: NETWORKS[job.chainId as ChainId]!.title,
          fundAmount: job.fundAmount,
          currency: job.token as EscrowFundToken,
          status: job.status,
        };
      });

      return new PageDto(data.page!, data.pageSize!, itemCount, jobs);
    } catch (error) {
      throw new ServerError(error.message, error.stack);
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
      throw new NotFoundError(ErrorJob.NotFound);
    }

    if (!jobEntity.escrowAddress) {
      throw new NotFoundError(ErrorJob.ResultNotFound);
    }

    const signer = this.web3Service.getSigner(jobEntity.chainId);
    const escrowClient = await EscrowClient.build(signer);

    const finalResultUrl = await escrowClient.getResultsUrl(
      jobEntity.escrowAddress,
    );

    if (!finalResultUrl) {
      throw new NotFoundError(ErrorJob.ResultNotFound);
    }

    if (jobEntity.requestType === FortuneJobType.FORTUNE) {
      const data = (await this.storageService.downloadJsonLikeData(
        finalResultUrl,
      )) as Array<FortuneFinalResultDto>;

      if (!data.length) {
        throw new NotFoundError(ErrorJob.ResultNotFound);
      }

      const allFortuneValidationErrors: ClassValidationError[] = [];

      for (const fortune of data) {
        const fortuneDtoCheck = new FortuneFinalResultDto();
        Object.assign(fortuneDtoCheck, fortune);
        const fortuneValidationErrors: ClassValidationError[] =
          await validate(fortuneDtoCheck);
        allFortuneValidationErrors.push(...fortuneValidationErrors);
      }

      if (allFortuneValidationErrors.length > 0) {
        this.logger.error(ErrorJob.ResultValidationFailed, {
          jobId: jobEntity.id,
          validationErrors: allFortuneValidationErrors,
        });
        throw new ValidationError(ErrorJob.ResultValidationFailed);
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

    if (!jobEntity || !jobEntity.escrowAddress) {
      throw new NotFoundError(ErrorJob.NotFound);
    }

    if (jobEntity.requestType === FortuneJobType.FORTUNE) {
      throw new ValidationError(ErrorJob.InvalidRequestType);
    }

    const signer = this.web3Service.getSigner(jobEntity.chainId);
    const escrowClient = await EscrowClient.build(signer);

    const finalResultUrl = await escrowClient.getResultsUrl(
      jobEntity.escrowAddress,
    );

    if (!finalResultUrl) {
      throw new NotFoundError(ErrorJob.ResultNotFound);
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
    if (requestType === FortuneJobType.FORTUNE) {
      return OracleType.FORTUNE;
    } else if (requestType === HCaptchaJobType.HCAPTCHA) {
      return OracleType.HCAPTCHA;
    } else if (
      Object.values(AudinoJobType).includes(requestType as AudinoJobType)
    ) {
      return OracleType.AUDINO;
    } else if (
      Object.values(CvatJobType).includes(requestType as CvatJobType)
    ) {
      return OracleType.CVAT;
    }
    throw new ConflictError(ErrorJob.InvalidRequestType);
  }

  public async processEscrowCancellation(jobEntity: JobEntity): Promise<void> {
    const { chainId, escrowAddress } = jobEntity;
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const escrowStatus = await escrowClient.getStatus(escrowAddress!);
    if (
      escrowStatus === EscrowStatus.Complete ||
      escrowStatus === EscrowStatus.Paid ||
      escrowStatus === EscrowStatus.Cancelled
    ) {
      throw new ConflictError(ErrorEscrow.InvalidStatusCancellation);
    }

    // Attempt requestCancellation; on any error attempt direct cancel once.
    // TODO: Remove try-catch when requestCancellation is fully supported by all escrows
    try {
      await (escrowClient as any).requestCancellation(escrowAddress!, {
        gasPrice: await this.web3Service.calculateGasPrice(chainId),
      });
    } catch (error: any) {
      this.logger.warn(
        'requestCancellation failed, attempting cancel fallback',
        {
          jobId: jobEntity.id,
          chainId,
          escrowAddress,
          error,
        },
      );
      await (escrowClient as any).cancel(escrowAddress!, {
        gasPrice: await this.web3Service.calculateGasPrice(chainId),
      });
    }
  }

  public async escrowFailedWebhook(dto: WebhookDataDto): Promise<void> {
    if (dto.eventType !== EventType.ESCROW_FAILED) {
      throw new ValidationError(ErrorJob.InvalidEventType);
    }
    const jobEntity = await this.jobRepository.findOneByChainIdAndEscrowAddress(
      dto.chainId,
      dto.escrowAddress,
    );

    if (!jobEntity) {
      throw new NotFoundError(ErrorJob.NotFound);
    }

    if (jobEntity.status !== JobStatus.LAUNCHED) {
      throw new ConflictError(ErrorJob.NotLaunched);
    }

    if (!dto.eventData) {
      throw new ValidationError('Event data is required but was not provided.');
    }

    const reason = dto.eventData.reason;

    if (!reason) {
      throw new ValidationError('Reason is undefined in event data.');
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
      throw new NotFoundError(ErrorJob.NotFound);
    }

    const { chainId, escrowAddress, manifestUrl, manifestHash } = jobEntity;
    const signer = this.web3Service.getSigner(chainId);

    let escrow;

    if (escrowAddress) {
      escrow = await EscrowUtils.getEscrow(chainId, escrowAddress);
    }

    const manifestData = await this.manifestService.downloadManifest(
      manifestUrl,
      jobEntity.requestType,
    );

    const fundTokenDecimals = getTokenDecimals(
      chainId,
      jobEntity.token as EscrowFundToken,
      18,
    );

    const baseManifestDetails = {
      chainId,
      tokenAddress: escrow ? escrow.token : ethers.ZeroAddress,
      requesterAddress: await signer.getAddress(),
      fundAmount: escrow
        ? Number(
            ethers.formatUnits(escrow.totalFundedAmount, fundTokenDecimals),
          )
        : 0,
      exchangeOracleAddress: escrow?.exchangeOracle || ethers.ZeroAddress,
      recordingOracleAddress: escrow?.recordingOracle || ethers.ZeroAddress,
      reputationOracleAddress: escrow?.reputationOracle || ethers.ZeroAddress,
    };

    let specificManifestDetails;
    if (jobEntity.requestType === FortuneJobType.FORTUNE) {
      const manifest = manifestData as FortuneManifestDto;
      specificManifestDetails = {
        title: manifest.requesterTitle,
        description: manifest.requesterDescription,
        requestType: FortuneJobType.FORTUNE,
        submissionsRequired: manifest.submissionsRequired,
        ...(manifest.qualifications &&
          manifest.qualifications?.length > 0 && {
            qualifications: manifest.qualifications,
          }),
      };
    } else if (jobEntity.requestType === HCaptchaJobType.HCAPTCHA) {
      const manifest = manifestData as HCaptchaManifestDto;
      specificManifestDetails = {
        requestType: HCaptchaJobType.HCAPTCHA,
        submissionsRequired: manifest.job_total_tasks,
        ...(manifest.qualifications &&
          manifest.qualifications?.length > 0 && {
            qualifications: manifest.qualifications,
          }),
      };
    } else if (
      Object.values(AudinoJobType).includes(
        jobEntity.requestType as AudinoJobType,
      )
    ) {
      const manifest = manifestData as AudinoManifestDto;
      specificManifestDetails = {
        requestType: manifest.annotation?.type,
        submissionsRequired: manifest.annotation?.segment_duration,
        description: manifest.annotation?.description,
        ...(manifest.annotation?.qualifications &&
          manifest.annotation?.qualifications?.length > 0 && {
            qualifications: manifest.annotation?.qualifications,
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
        balance: Number(
          ethers.formatUnits(escrow?.balance || 0, fundTokenDecimals),
        ),
        paidOut: Number(
          ethers.formatUnits(escrow?.amountPaid || 0, fundTokenDecimals),
        ),
        currency: jobEntity.token as EscrowFundToken,
        status: jobEntity.status,
        failedReason: jobEntity.failedReason,
      },
      manifest: manifestDetails,
    };
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
    } catch {
      // Ignore error
    }

    return BigInt(feeValue ? feeValue : 1);
  }

  public async finalizeJob(dto: WebhookDataDto): Promise<void> {
    const jobEntity = await this.jobRepository.findOneByChainIdAndEscrowAddress(
      dto.chainId,
      dto.escrowAddress,
    );

    if (!jobEntity) {
      throw new NotFoundError(ErrorJob.NotFound);
    }

    // If job status already completed or canceled by getDetails do nothing
    if (
      jobEntity.status === JobStatus.COMPLETED ||
      jobEntity.status === JobStatus.CANCELED
    ) {
      return;
    }

    if (
      jobEntity.status !== JobStatus.LAUNCHED &&
      jobEntity.status !== JobStatus.PARTIAL &&
      jobEntity.status !== JobStatus.CANCELING
    ) {
      throw new ConflictError(ErrorJob.InvalidStatusCompletion);
    }

    // Finalize job based on event type
    if (
      dto.eventType === EventType.ESCROW_COMPLETED &&
      (jobEntity.status === JobStatus.LAUNCHED ||
        jobEntity.status === JobStatus.PARTIAL)
    ) {
      jobEntity.status = JobStatus.COMPLETED;
      await this.jobRepository.updateOne(jobEntity);
    } else if (
      dto.eventType === EventType.ESCROW_CANCELED &&
      (jobEntity.status === JobStatus.LAUNCHED ||
        jobEntity.status === JobStatus.PARTIAL ||
        jobEntity.status === JobStatus.CANCELING)
    ) {
      this.cancelJob(jobEntity);
    } else {
      throw new ConflictError(ErrorJob.InvalidStatusCompletion);
    }
  }

  public async cancelJob(jobEntity: JobEntity): Promise<void> {
    const token = (TOKEN_ADDRESSES[jobEntity.chainId as ChainId] ?? {})[
      jobEntity.token as EscrowFundToken
    ];

    if (!token) {
      throw new Error(ErrorPayment.UnsupportedToken);
    }

    const slash = await this.paymentService.getJobPayments(
      jobEntity.id,
      PaymentType.SLASH,
    );
    if (!slash?.length) {
      let refund: ICancellationRefund | null = null;
      try {
        refund = await EscrowUtils.getCancellationRefund(
          jobEntity.chainId,
          jobEntity.escrowAddress!,
        );
      } catch {
        // Ignore error
      }

      let amount = 0n;

      if (!refund) {
        //Temp fix
        amount = await this.getRefundAmount(
          jobEntity.chainId,
          jobEntity.escrowAddress!,
          token.address,
        );
      } else {
        if (!refund.amount) {
          throw new ConflictError(ErrorJob.NoRefundFound);
        }
        amount = refund.amount;
      }

      if (amount > 0n) {
        await this.paymentService.createRefundPayment({
          refundAmount: Number(ethers.formatUnits(amount, token.decimals)),
          refundCurrency: jobEntity.token,
          userId: jobEntity.userId,
          jobId: jobEntity.id,
        });
      }
    }

    jobEntity.status = JobStatus.CANCELED;
    await this.jobRepository.updateOne(jobEntity);
  }

  public async getRefundAmount(
    chainId: ChainId,
    escrowAddress: string,
    tokenAddress: string,
  ): Promise<bigint> {
    const signer = this.web3Service.getSigner(chainId);
    const provider = signer.provider!;
    const contract: Escrow = Escrow__factory.connect(escrowAddress!, provider);
    const fromBlock = 79278120; //This issue started at this block
    const toBlock = 'latest';
    const cancelledFilter = contract.filters?.Cancelled?.();
    const cancelledLogs = await contract.queryFilter(
      cancelledFilter,
      fromBlock,
      toBlock,
    );

    for (const log of cancelledLogs) {
      const erc20Interface = new ethers.Interface([
        'event Transfer(address indexed from, address indexed to, uint256 value)',
      ]);

      const transferTopic = erc20Interface.getEvent('Transfer')!.topicHash;
      const receipt = await provider.getTransactionReceipt(log.transactionHash);

      const transferLogs = receipt!.logs.filter(
        (l) =>
          l.address.toLowerCase() === tokenAddress.toLowerCase() &&
          l.topics[0] === transferTopic,
      );
      for (const tlog of transferLogs) {
        const decoded = erc20Interface.decodeEventLog(
          'Transfer',
          tlog.data,
          tlog.topics,
        );

        const from = decoded.from as string;
        const to = decoded.to as string;
        const value = decoded.value as bigint;
        if (
          from.toLowerCase() === escrowAddress.toLowerCase() &&
          to.toLowerCase() === (await signer.getAddress()).toLowerCase()
        ) {
          return value;
        }
      }
    }

    return 0n;
  }
}
