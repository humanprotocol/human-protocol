import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Wallet, providers, BigNumber } from 'ethers';
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
  EscrowClient,
  InitClient,
  StorageClient,
  StorageCredentials,
  StorageParams,
  UploadFile,
} from '@human-protocol/sdk';
import {
  JobCvatCreateDto,
  JobFortuneCreateDto,
  SaveManifestDto,
  SendWebhookDto,
} from './job.dto';
import { ManifestDto } from '../payment/payment.dto';
import { PaymentSource, PaymentType } from '../../common/enums/payment';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { networkMap } from '../../common/decorators';

@Injectable()
export class JobService {
  public readonly logger = new Logger(JobService.name);
  public readonly storageClient: StorageClient;
  public readonly storageParams: StorageParams;
  public readonly bucket: string;

  constructor(
    public readonly jobRepository: JobRepository,
    public readonly paymentService: PaymentService,
    public readonly httpService: HttpService,
    public readonly configService: ConfigService,
  ) {
    const storageCredentials: StorageCredentials = {
      accessKey: this.configService.get<string>('S3_ACCESS_KEY', ''),
      secretKey: this.configService.get<string>('S3_SECRET_KEY', ''),
    };

    this.storageParams = {
      endPoint: this.configService.get<string>(
        'S3_ENDPOINT',
        'http://127.0.0.1',
      ),
      port: Number(this.configService.get<number>('S3_PORT', 9000)),
      useSSL: Boolean(this.configService.get<boolean>('S3_USE_SSL', false)),
    };

    this.bucket = this.configService.get<string>('S3_BUCKET', 'launcher');

    this.storageClient = new StorageClient(
      storageCredentials,
      this.storageParams,
    );
  }

  public async createFortuneJob(
    userId: number,
    dto: JobFortuneCreateDto,
  ): Promise<number> {
    const {
      chainId,
      fortunesRequired,
      requesterTitle,
      requesterDescription,
      fundAmount,
    } = dto;

    const userBalance = await this.paymentService.getUserBalance(userId);

    if (userBalance.lte(fundAmount)) {
      this.logger.log(ErrorJob.NotEnoughFunds, JobService.name);
      throw new NotFoundException(ErrorJob.NotEnoughFunds);
    }

    const manifestData: ManifestDto = {
      submissionsRequired: fortunesRequired,
      requesterTitle,
      requesterDescription,
      fundAmount,
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
      BigNumber.from(fundAmount),
    );

    jobEntity.status = JobStatus.PAID;
    await jobEntity.save();

    return jobEntity.id;
  }

  public async createCvatJob(
    userId: number,
    dto: JobCvatCreateDto,
  ): Promise<number> {
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

    if (userBalance.lte(fundAmount)) {
      this.logger.log(ErrorJob.NotEnoughFunds, JobService.name);
      throw new NotFoundException(ErrorJob.NotEnoughFunds);
    }

    const manifestData: ManifestDto = {
      dataUrl,
      submissionsRequired: annotationsPerImage,
      labels,
      requesterDescription,
      requesterAccuracyTarget,
      fundAmount,
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
      BigNumber.from(fundAmount),
    );

    jobEntity.status = JobStatus.PAID;
    await jobEntity.save();

    return jobEntity.id;
  }

  public async launchJob(jobEntity: JobEntity): Promise<void> {
    try {
      const provider = new providers.JsonRpcProvider(
        Object.values(networkMap).find(
          (item) => item.network.chainId === jobEntity.chainId,
        )?.rpcUrl,
      );
      const signer = new Wallet(
        this.configService.get<string>(
          'WEB3_JOB_LAUNCHER_PRIVATE_KEY',
          'web3 private key',
        ),
        provider,
      );
      const clientParams = await InitClient.getParams(signer);

      const escrowClient = new EscrowClient(clientParams);

      const exchangeOracleWebhookUrl = this.configService.get<string>(
        'EXCHANGE_ORACLE_WEBHOOK_URL',
        '',
      );
      const recordingOracle = this.configService.get<string>(
        'RECORDING_ORACLE_ADDRESS',
        '',
      );
      const reputationOracle = this.configService.get<string>(
        'REPUTATION_ORACLE_ADDRESS',
        '',
      );
      const recordingOracleStFee = this.configService.get<number>(
        'RECORDING_ORACLE_FEE',
        0,
      );
      const reputationOracleFee = this.configService.get<number>(
        'REPUTATION_ORACLE_FEE',
        0,
      );

      const escrowConfig = {
        recordingOracle,
        reputationOracle,
        recordingOracleFee: BigNumber.from(recordingOracleStFee),
        reputationOracleFee: BigNumber.from(reputationOracleFee),
        manifestUrl: jobEntity.manifestUrl,
        manifestHash: jobEntity.manifestHash,
      };

      const escrowAddress = await escrowClient.createAndSetupEscrow(
        clientParams.network.hmtAddress,
        [],
        escrowConfig,
      );

      if (!escrowAddress) {
        this.logger.log(ErrorEscrow.NotCreated, JobService.name);
        throw new NotFoundException(ErrorEscrow.NotCreated);
      }

      jobEntity.escrowAddress = escrowAddress;
      jobEntity.status = JobStatus.LAUNCHED;
      await jobEntity.save();

      const manifest = await this.getManifest(jobEntity.manifestUrl);

      if (manifest.requestType === JobRequestType.IMAGE_LABEL_BINARY) {
        this.sendWebhook(exchangeOracleWebhookUrl, {
          escrowAddress: jobEntity.escrowAddress,
          chainId: jobEntity.chainId,
        });
      }

      return;
    } catch (e) {
      this.logger.log(ErrorEscrow.NotCreated, JobService.name);
      return;
    }
  }

  public async saveManifest(
    encryptedManifest: any,
    bucket: string,
  ): Promise<SaveManifestDto> {
    try {
      const uploadedFiles: UploadFile[] = await this.storageClient.uploadFiles(
        [encryptedManifest],
        bucket,
      );

      if (!uploadedFiles[0]) {
        this.logger.log(ErrorBucket.UnableSaveFile, JobService.name);
        throw new BadGatewayException(ErrorBucket.UnableSaveFile);
      }

      const { key, hash } = uploadedFiles[0];
      const manifestUrl = this.createFileUrl(key);

      return { manifestUrl, manifestHash: hash };
    } catch (e) {
      throw new Error(e.message);
    }
  }

  public createFileUrl(key: string): string {
    if (this.storageParams.port) {
      return `${this.storageParams.endPoint}:${this.storageParams.port}/${this.bucket}/${key}.json`;
    } else {
      return `${this.storageParams.endPoint}/${this.bucket}/${key}.json`;
    }
  }

  public async getManifest(manifestUrl: string): Promise<ManifestDto> {
    const { data } = await firstValueFrom(
      await this.httpService.get(manifestUrl),
    );

    if (!data) {
      throw new NotFoundException(ErrorJob.ManifestNotFound);
    }

    return data;
  }

  public async sendWebhook(
    webhookUrl: string,
    webhookData: SendWebhookDto,
  ): Promise<boolean> {
    const { data } = await firstValueFrom(
      await this.httpService.post(webhookUrl, webhookData),
    );

    if (!data) {
      throw new NotFoundException(ErrorJob.WebhookWasNotSent);
    }

    return true;
  }
}
