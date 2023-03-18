import { BadGatewayException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JobMode, JobRequestType, JobStatus } from "../common/decorators";
import { PaymentService } from "../payment/payment.service";
import { IJobCvatCreateDto, IJobFortuneCreateDto, IJobLaunchDto } from "./interfaces";
import { JobEntity } from "./job.entity";
import * as errors from "../common/constants/errors";
import { StorageService } from "../storage/storage.service";
import { manifestFormatter } from "./serializers/job.responses";
import { StorageDataType } from "../common/constants/storage";
import { ConfigService } from "@nestjs/config";
import { BaseProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { Contract } from '@ethersproject/contracts';
import { EthersContract, EthersSigner, InjectContractProvider, InjectEthersProvider, InjectSignerProvider } from "nestjs-ethers";
import { v4 as uuidv4 } from 'uuid';
import Escrow from '../contracts/Escrow.sol/Escrow.json';
import EscrowFactory from "../contracts/EscrowFactory.sol/EscrowFactory.json";
import { SortDirection } from "../common/collection";

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    @InjectEthersProvider()
    private readonly ethersProvider: BaseProvider,
    @InjectSignerProvider()
    private readonly ethersSigner: EthersSigner,
    @InjectContractProvider()
    private readonly ethersContract: EthersContract,
    private readonly paymentService: PaymentService,
    @InjectRepository(JobEntity)
    private readonly jobEntityRepository: Repository<JobEntity>,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  public async createFortuneJob(userId: number, dto: IJobFortuneCreateDto): Promise<number> {
    const { chainId, fortunesRequired, requesterTitle, requesterDescription, price } = dto;

    const jobEntity = await this.jobEntityRepository
      .create({
        chainId,
        userId,
        submissionsRequired: fortunesRequired,
        requesterTitle,
        requesterDescription,
        price,
        mode: JobMode.DESCRIPTIVE,
        requestType: JobRequestType.FORTUNE,
        status: JobStatus.PENDING,
        waitUntil: new Date()
      })
      .save();

    if (!jobEntity) {
      this.logger.log(errors.Job.NotCreated, JobService.name);
      throw new NotFoundException(errors.Job.NotCreated);
    }

    return jobEntity.id;
  }

  public async createCvatJob(userId: number, dto: IJobCvatCreateDto): Promise<number> {
    const { chainId, dataUrl, annotationsPerImage, labels, requesterDescription, requesterAccuracyTarget, price } = dto;

    if (!await this.storageService.isBucketValid(dataUrl)) {
      this.logger.log(errors.Bucket.NotPublic, JobService.name);
      throw new NotFoundException(errors.Bucket.NotPublic);
    }

    const jobEntity = await this.jobEntityRepository
      .create({
        chainId,
        userId,
        dataUrl,
        submissionsRequired: annotationsPerImage,
        labels,
        requesterDescription,
        requesterAccuracyTarget,
        price,
        mode: JobMode.BATCH,
        requestType: JobRequestType.IMAGE_LABEL_BINARY,
        status: JobStatus.PENDING,
      })
      .save();

    if (!jobEntity) {
      this.logger.log(errors.Job.NotCreated, JobService.name);
      throw new NotFoundException(errors.Job.NotCreated);
    }

    return jobEntity.id;
  }

  public async confirmPayment(customerId: string, dto: IJobLaunchDto): Promise<boolean> {
    const jobEntity = await this.jobEntityRepository.findOne({ id: dto.jobId });

    if (!jobEntity) {
      this.logger.log(errors.User.NotFound, JobService.name);
      throw new NotFoundException(errors.Job.NotFound);
    }

    await this.paymentService.confirmPayment(customerId, dto)

    jobEntity.status = JobStatus.PAID;
    await jobEntity.save();

    return true;
  }

  public async launchJob(jobEntity: JobEntity): Promise<boolean> {
    try {
      // TODO: Implement SDK instead of using ABI https://github.com/humanprotocol/human-protocol/issues/309
      // TODO: Implement encryption algorithm https://github.com/humanprotocol/human-protocol/issues/290
      const mannifestData = manifestFormatter(jobEntity)

      // TODO: Think about name of the file `<timestamp>-manifest-<uuidv4()>.json
      // TODO: Get manifest hash https://github.com/orgs/humanprotocol/projects/9/views/1?filterQuery=manifest&pane=issue&itemId=15143517
      const manifestUrl = this.storageService.saveData(StorageDataType.MANIFEST, uuidv4(), mannifestData);

      // TODO: Add automatic selection of the chain of oracles https://github.com/humanprotocol/human-protocol/issues/335
      const jobLauncherPK = this.configService.get<string>("WEB3_JOB_LAUNCHER_PRIVATE_KEY", "");
      const operator: Wallet = this.ethersSigner.createWallet(jobLauncherPK);

      const escrowFactory: Contract = this.ethersContract.create(
        this.configService.get<string>("WEB3_ESCROW_FACTORY_ADDRESS", ""),
        EscrowFactory.abi
      );

      // TODO: Add retry policy and process failure requests https://github.com/humanprotocol/human-protocol/issues/334
      const gasLimit = await escrowFactory.connect(operator).estimateGas
        .createEscrow([])
      const gasPrice = await this.ethersProvider.getGasPrice();

      const result: any = await (
        await escrowFactory
          .connect(operator)
          .createEscrow([], { gasLimit, gasPrice })
      ).wait()

      if (!result?.events[0]?.transactionHash) {
        throw new BadGatewayException("Transaction hash related with createEscrow method does not exists");
      }

      const escrowAddress = await escrowFactory.lastEscrow()

      if (!escrowAddress) {
        this.logger.log(errors.Escrow.NotCreated, JobService.name);
        throw new NotFoundException(errors.Escrow.NotCreated);
      }

      if (!jobEntity.escrowAddress) {
        this.logger.debug(`Escrow address does not exists for job with id ${jobEntity.id}`);
        Object.assign(jobEntity, { status: JobStatus.FAILED });
        await jobEntity.save();
        throw new NotFoundException("Escrow address does not exists");
      }

      const escrow: Contract = this.ethersContract.create(
        jobEntity.escrowAddress,
        Escrow.abi
      );

      const gasLimitSetup = await escrow.connect(operator).estimateGas
        .setup(
          "reputationOracleAddress",
          "recordingOracleAddress",
          1,
          1,
          manifestUrl,
          "manifestHash"
        )
      const gasPriceSetup = await this.ethersProvider.getGasPrice();

      await (
        await escrow
          .connect(operator)
          .setup(
            "reputationOracleAddress",
            "recordingOracleAddress",
            1,
            1,
            manifestUrl,
            "manifestHash", { gasLimit: gasLimitSetup, gasPrice: gasPriceSetup }
          )
      ).wait()
      
      jobEntity.escrowAddress = escrowAddress;
      jobEntity.status = JobStatus.LAUNCHED;
      await jobEntity.save();
      
      return true;
    } catch (e) {
      this.logger.log(errors.Escrow.NotCreated, JobService.name);
      throw new NotFoundException(errors.Escrow.NotCreated);
    }
  }
}
