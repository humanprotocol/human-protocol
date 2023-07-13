/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ethers } from 'ethers';
import { validate } from 'class-validator';
import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ValidationError,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BigNumber } from 'ethers';
import { JobMode, JobRequestType, JobStatus } from '../../common/enums/job';
import { PaymentService } from '../payment/payment.service';
import { JobEntity } from './job.entity';
import { JobRepository } from './job.repository';
import {
  ErrorBucket,
  ErrorEscrow,
  ErrorJob,
} from '../../common/constants/errors';
import {
  ChainId,
  EscrowClient,
  NETWORKS,
  StorageClient,
  StorageCredentials,
  StorageParams,
  UploadFile,
} from '@human-protocol/sdk';
import {
  FortuneManifestDto,
  ImageLabelBinaryManifestDto,
  JobCvatDto,
  JobFortuneDto,
  SaveManifestDto,
  SendWebhookDto,
} from './job.dto';
import { PaymentSource, PaymentType } from '../../common/enums/payment';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Web3Service } from '../web3/web3.service';
import { ConfigNames } from '../../common/config';
import { HMToken, HMToken__factory } from '@human-protocol/core/typechain-types';
import { IId } from 'src/common/interfaces';

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
    public readonly paymentService: PaymentService,
    public readonly httpService: HttpService,
    public readonly configService: ConfigService,
  ) {
    const storageCredentials: StorageCredentials = {
      accessKey: this.configService.get<string>(ConfigNames.S3_ACCESS_KEY)!,
      secretKey: this.configService.get<string>(ConfigNames.S3_SECRET_KEY)!,
    };

    const useSSL =
      this.configService.get<string>(ConfigNames.S3_USE_SSL) === 'true';
    this.storageParams = {
      endPoint: this.configService.get<string>(ConfigNames.S3_ENDPOINT)!,
      port: 9000,
      useSSL,
    };

    this.bucket = this.configService.get<string>(ConfigNames.S3_BACKET)!;

    this.storageClient = new StorageClient(
      storageCredentials,
      this.storageParams,
    );
  }

  public async createFortuneJob(
    userId: number,
    dto: JobFortuneDto,
  ): Promise<IId> {
    const {
      chainId,
      fortunesRequired,
      requesterTitle,
      requesterDescription,
      fundAmount,
    } = dto;

    const userBalance = await this.paymentService.getUserBalance(userId);

    const fundAmountInWei = ethers.utils.parseUnits(
      fundAmount.toString(),
      'ether',
    );

    const totalFeePercentage = BigNumber.from(
      this.configService.get<number>(ConfigNames.JOB_LAUNCHER_FEE)!,
    )
      .add(this.configService.get<number>(ConfigNames.RECORDING_ORACLE_FEE)!)
      .add(this.configService.get<number>(ConfigNames.REPUTATION_ORACLE_FEE)!);
    const totalFee = BigNumber.from(fundAmountInWei)
      .mul(totalFeePercentage)
      .div(100);
    const totalAmount = BigNumber.from(fundAmountInWei).add(totalFee);

    if (userBalance.lte(totalAmount)) {
      this.logger.log(ErrorJob.NotEnoughFunds, JobService.name);
      throw new BadRequestException(ErrorJob.NotEnoughFunds);
    }

    const manifestData: FortuneManifestDto | ImageLabelBinaryManifestDto = {
      submissionsRequired: fortunesRequired,
      requesterTitle,
      requesterDescription,
      fee: totalFee.toString(),
      fundAmount: totalAmount.toString(),
      mode: JobMode.DESCRIPTIVE,
      requestType: JobRequestType.FORTUNE,
    };

    const { manifestUrl, manifestHash } = await this.saveManifest(
      manifestData,
      this.bucket,
    );

    const jobEntity = await this.jobRepository.create({
      chainId,
      userId,
      manifestUrl,
      manifestHash,
      fee: totalFee.toString(),
      fundAmount: totalAmount.toString(),
      status: JobStatus.PENDING,
      waitUntil: new Date(),
    });

    if (!jobEntity) {
      this.logger.log(ErrorJob.NotCreated, JobService.name);
      throw new NotFoundException(ErrorJob.NotCreated);
    }

    await this.paymentService.savePayment(
      userId,
      PaymentSource.BALANCE,
      PaymentType.WITHDRAWAL,
      BigNumber.from(totalAmount),
    );

    jobEntity.status = JobStatus.PAID;
    await jobEntity.save();

    return {
      id: jobEntity.id
    }
  }

  public async createCvatJob(userId: number, dto: JobCvatDto): Promise<IId> {
    const {
      chainId,
      dataUrl,
      annotationsPerImage,
      labels,
      requesterDescription,
      requesterAccuracyTarget,
      fundAmount,
    } = dto;

    const userBalance = await this.paymentService.getUserBalance(userId);

    const fundAmountInWei = ethers.utils.parseUnits(
      fundAmount.toString(),
      'ether',
    );

    const jobLauncherFee = BigNumber.from(
      this.configService.get<number>(ConfigNames.JOB_LAUNCHER_FEE)!,
    );
    const recordingOracleFee = BigNumber.from(
      this.configService.get<number>(ConfigNames.RECORDING_ORACLE_FEE)!,
    );
    const reputationOracleFee = BigNumber.from(
      this.configService.get<number>(ConfigNames.REPUTATION_ORACLE_FEE)!,
    );

    const totalFeePercentage = BigNumber.from(jobLauncherFee)
      .add(recordingOracleFee)
      .add(reputationOracleFee);
    const totalFee = BigNumber.from(fundAmountInWei)
      .mul(totalFeePercentage)
      .div(100);
    const totalAmount = BigNumber.from(fundAmountInWei).add(totalFee);

    if (userBalance.lte(totalAmount)) {
      this.logger.log(ErrorJob.NotEnoughFunds, JobService.name);
      throw new NotFoundException(ErrorJob.NotEnoughFunds);
    }

    const manifestData: FortuneManifestDto | ImageLabelBinaryManifestDto = {
      dataUrl,
      submissionsRequired: annotationsPerImage,
      labels,
      requesterDescription,
      requesterAccuracyTarget,
      fee: totalFee.toString(),
      fundAmount: totalAmount.toString(),
      mode: JobMode.BATCH,
      requestType: JobRequestType.IMAGE_LABEL_BINARY,
    };

    const { manifestUrl, manifestHash } = await this.saveManifest(
      manifestData,
      this.bucket,
    );

    const jobEntity = await this.jobRepository.create({
      chainId,
      userId,
      manifestUrl,
      manifestHash,
      fee: totalFee.toString(),
      fundAmount: totalAmount.toString(),
      status: JobStatus.PENDING,
      waitUntil: new Date(),
    });

    if (!jobEntity) {
      this.logger.log(ErrorJob.NotCreated, JobService.name);
      throw new NotFoundException(ErrorJob.NotCreated);
    }

    await this.paymentService.savePayment(
      userId,
      PaymentSource.BALANCE,
      PaymentType.WITHDRAWAL,
      BigNumber.from(totalAmount),
    );

    jobEntity.status = JobStatus.PAID;
    await jobEntity.save();

    return {
      id: jobEntity.id
    }
  }

  public async launchJob(jobEntity: JobEntity): Promise<JobEntity> {
    const signer = this.web3Service.getSigner(jobEntity.chainId);

    const escrowClient = await EscrowClient.build(signer);

    const escrowConfig = {
      recordingOracle: this.configService.get<string>(ConfigNames.RECORDING_ORACLE_ADDRESS)!,
      reputationOracle: this.configService.get<string>(ConfigNames.REPUTATION_ORACLE_ADDRESS)!,
      recordingOracleFee: BigNumber.from(
        this.configService.get<number>(ConfigNames.RECORDING_ORACLE_FEE)!,
      ),
      reputationOracleFee: BigNumber.from(
        this.configService.get<number>(ConfigNames.REPUTATION_ORACLE_FEE)!,
      ),
      manifestUrl: jobEntity.manifestUrl,
      manifestHash: jobEntity.manifestHash,
    };

      const escrowAddress = await escrowClient.createAndSetupEscrow(
        NETWORKS[jobEntity.chainId as ChainId]!.hmtAddress,
        [],
        escrowConfig,
      );

    if (!escrowAddress) {
      this.logger.log(ErrorEscrow.NotCreated, JobService.name);
      throw new NotFoundException(ErrorEscrow.NotCreated);
    }

      const manifest = await this.getManifest(jobEntity.manifestUrl);

      await this.validateManifest(manifest);

      const tokenContract: HMToken = HMToken__factory.connect(
        NETWORKS[jobEntity.chainId as ChainId]!.hmtAddress,
        signer
      );
      await tokenContract.transfer(escrowAddress, jobEntity.fundAmount);

      jobEntity.escrowAddress = escrowAddress;
      jobEntity.status = JobStatus.LAUNCHED;
      await jobEntity.save();

      if (manifest.requestType === JobRequestType.IMAGE_LABEL_BINARY) {
        this.sendWebhook(
          this.configService.get<string>(
            ConfigNames.EXCHANGE_ORACLE_WEBHOOK_URL,
          )!,
          {
            escrowAddress: jobEntity.escrowAddress,
            chainId: jobEntity.chainId,
          },
        );
      }

    return jobEntity;
  }

  public async saveManifest(
    encryptedManifest: any,
    bucket: string,
  ): Promise<SaveManifestDto> {
    const uploadedFiles: UploadFile[] = await this.storageClient.uploadFiles(
      [encryptedManifest],
      bucket,
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
    manifest: FortuneManifestDto | ImageLabelBinaryManifestDto,
  ): Promise<boolean> {
    const dtoCheck = new FortuneManifestDto();
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
  ): Promise<FortuneManifestDto | ImageLabelBinaryManifestDto> {
    const manifest = await StorageClient.downloadFileFromUrl(manifestUrl);

    if (!manifest) {
      throw new NotFoundException(ErrorJob.ManifestNotFound);
    }

    return manifest;
  }

  public async sendWebhook(
    webhookUrl: string,
    webhookData: SendWebhookDto,
  ): Promise<boolean> {
    const { data } = await firstValueFrom(
      await this.httpService.post(webhookUrl, webhookData),
    );

    if (!data) {
      this.logger.log(ErrorJob.WebhookWasNotSent, JobService.name);
      throw new NotFoundException(ErrorJob.WebhookWasNotSent);
    }

    return true;
  }
}
