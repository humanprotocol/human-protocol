import { Contract } from "@ethersproject/contracts";
import { BaseProvider } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";
import { BadGatewayException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import {
  EthersContract,
  EthersSigner,
  InjectContractProvider,
  InjectEthersProvider,
  InjectSignerProvider,
} from "nestjs-ethers";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import * as errors from "../common/constants/errors";
import { StorageDataType } from "../common/constants/storage";
import { JobMode, JobRequestType, JobStatus } from "../common/enums/job";
import { encrypt } from "../common/helpers";
import { IKeyPair } from "../common/interfaces/encryption";
import Escrow from "@human-protocol/core/abis/Escrow.json";
import EscrowFactory from "@human-protocol/core/abis/EscrowFactory.json";
import { PaymentService } from "../payment/payment.service";
import { StorageService } from "../storage/storage.service";
import { IJobCvatCreateDto, IJobFortuneCreateDto, IJobLaunchDto } from "./interfaces";
import { JobEntity } from "./job.entity";
import { IManifestDto } from "./serializers/job.responses";

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);
  public keyPair: IKeyPair;

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
  ) {
    this.keyPair = {
      mnemonic: this.configService.get<string>("MNEMONIC", "mnemonic"),
      privateKey: this.configService.get<string>("PGP_PRIVATE_KEY", "private key"),
      publicKey: this.configService.get<string>("PGP_PUBLIC_KEY", "public key"),
    };
  }

  public async createFortuneJob(userId: number, dto: IJobFortuneCreateDto): Promise<number> {
    const { chainId, fortunesRequired, requesterTitle, requesterDescription, price } = dto;

    const manifestData: IManifestDto = {
      chainId,
      submissionsRequired: fortunesRequired,
      requesterTitle,
      requesterDescription,
      price,
      mode: JobMode.DESCRIPTIVE,
      requestType: JobRequestType.FORTUNE,
    };

    // TODO: Impement KVStore integration
    // TODO: Add automatic selection of the chain of oracles https://github.com/humanprotocol/human-protocol/issues/335
    // TODO: Add public keys of oracles
    const encryptedManifest = await this.encryptManifest(manifestData, [
      /* ...add more public keys */
    ]);
    const manifestUrl = await this.saveManifest(encryptedManifest);

    const jobEntity = await this.jobEntityRepository
      .create({
        chainId,
        userId,
        manifestUrl,
        status: JobStatus.PENDING,
        waitUntil: new Date(),
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

    const manifestData: IManifestDto = {
      chainId,
      dataUrl,
      submissionsRequired: annotationsPerImage,
      labels,
      requesterDescription,
      requesterAccuracyTarget,
      price,
      mode: JobMode.BATCH,
      requestType: JobRequestType.IMAGE_LABEL_BINARY,
    };

    // TODO: Impement KVStore integration
    // TODO: Add automatic selection of the chain of oracles https://github.com/humanprotocol/human-protocol/issues/335
    // TODO: Add public keys of oracles
    const encryptedManifest = await this.encryptManifest(manifestData, [
      /* ...add more public keys */
    ]);
    const manifestUrl = await this.saveManifest(encryptedManifest);

    const jobEntity = await this.jobEntityRepository
      .create({
        chainId,
        userId,
        manifestUrl,
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

    await this.paymentService.confirmPayment(customerId, dto);

    jobEntity.status = JobStatus.PAID;
    await jobEntity.save();

    return true;
  }

  public async launchJob(jobEntity: JobEntity): Promise<boolean> {
    try {
      const jobLauncherPK = this.configService.get<string>("WEB3_JOB_LAUNCHER_PRIVATE_KEY", "web3 private key");
      const operator: Wallet = this.ethersSigner.createWallet(jobLauncherPK);

      const escrowFactory: Contract = this.ethersContract.create(
        this.configService.get<string>("WEB3_ESCROW_FACTORY_ADDRESS", ""),
        EscrowFactory,
      );

      // TODO: Implement SDK instead of using ABI https://github.com/humanprotocol/human-protocol/issues/309
      // TODO: Get manifest hash https://github.com/orgs/humanprotocol/projects/9/views/1?filterQuery=manifest&pane=issue&itemId=15143517
      // TODO: Add retry policy and process failure requests https://github.com/humanprotocol/human-protocol/issues/334
      const gasLimit = await escrowFactory.connect(operator).estimateGas.createEscrow([]);
      const gasPrice = await this.ethersProvider.getGasPrice();

      const result: any = await (await escrowFactory.connect(operator).createEscrow([], { gasLimit, gasPrice })).wait();

      if (!result?.events[0]?.transactionHash) {
        throw new BadGatewayException("Transaction hash related with createEscrow method does not exists");
      }

      const escrowAddress = await escrowFactory.lastEscrow();

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

      const escrow: Contract = this.ethersContract.create(jobEntity.escrowAddress, Escrow);

      const gasLimitSetup = await escrow
        .connect(operator)
        .estimateGas.setup(
          "reputationOracleAddress",
          "recordingOracleAddress",
          1,
          1,
          jobEntity.manifestUrl,
          "manifestHash",
        );
      const gasPriceSetup = await this.ethersProvider.getGasPrice();

      await (
        await escrow
          .connect(operator)
          .setup("reputationOracleAddress", "recordingOracleAddress", 1, 1, jobEntity.manifestUrl, "manifestHash", {
            gasLimit: gasLimitSetup,
            gasPrice: gasPriceSetup,
          })
      ).wait();

      jobEntity.escrowAddress = escrowAddress;
      jobEntity.status = JobStatus.LAUNCHED;
      await jobEntity.save();

      return true;
    } catch (e) {
      this.logger.log(errors.Escrow.NotCreated, JobService.name);
      return true;
    }
  }

  private async encryptManifest(manifest: IManifestDto, recipientsKeys: string[]): Promise<string> {
    // TODO: Add public keys of oracles
    const encryptionParams = {
      privateKey: this.keyPair.privateKey,
      publicKeys: [...recipientsKeys, this.keyPair.publicKey],
      mnemonic: this.keyPair.mnemonic,
      message: JSON.stringify(manifest),
    };

    return encrypt(encryptionParams);
  }

  private saveManifest(encryptedManifest: string): Promise<string> {
    return this.storageService.saveData(StorageDataType.MANIFEST, uuidv4(), encryptedManifest);
  }
}
