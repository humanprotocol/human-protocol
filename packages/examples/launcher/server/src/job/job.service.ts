import { BadGatewayException, BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { FindConditions, FindManyOptions, FindOneOptions, Repository } from "typeorm";
import * as crypto from "crypto";
import HMToken from '../contracts/HMToken.sol/HMToken.json';
import Escrow from '../contracts/Escrow.sol/Escrow.json';
import EscrowFactory from "../contracts/EscrowFactory.sol/EscrowFactory.json";

import { InjectEthersProvider, BaseProvider, EthersSigner, InjectSignerProvider, Wallet, EthersContract, InjectContractProvider, Contract, Signer, AlchemyProvider, StaticJsonRpcProvider, PocketProvider, MUMBAI_NETWORK } from 'nestjs-ethers';

import { JobEntity } from "./job.entity";
import { CONFIRMATION_TRESHOLD, JobMode, JobRequestType, JobStatus } from "../common/decorators";
import { IJobApproveDto, IJobCreateDto } from "./interfaces";
import { StorageService } from "../storage/storage.service";
import { IJobDto, IManifestDataItemDto, IManifestDto, jobFormatter, manifestFormatter } from "./serializers/job.responses";
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { IJobManifestDto } from "./interfaces/manifest";
import { SortDirection } from "../common/collection";
import { DATA_SAMPLE_SIZE } from "../common/constants";
import { avg, isAnGroundTruthDataAnnotations, isAnGroundTruthDataImage, max, min } from "../common/helpers";
import { IJobFeeRangeDto } from "./interfaces/feeRange";
import { NetworkId } from "../common/constants/networks";
import { ethers } from "ethers";
import { ILiquidityDto } from "./interfaces/liquidity";
import { networkMap, networks } from "./interfaces/network";


@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);
  private recordingOracleUrl: string;
  private reputationOracleUrl: string;
  private exchangeOracleUrl: string;
  private recordingOracleStake: number;
  private reputationOracleStake: number;
  private recordingOracleAddress: string;
  private reputationOracleAddress: string;
  private exchangeOracleAddress: string;

  constructor(
    @InjectEthersProvider('goerli')
    private readonly goerliProvider: StaticJsonRpcProvider,
    @InjectEthersProvider('polygon')
    private readonly polygonProvider: StaticJsonRpcProvider,
    @InjectEthersProvider('mumbai')
    private readonly mumbaiProvider: StaticJsonRpcProvider,
    @InjectEthersProvider()
    private readonly ethersProvider: BaseProvider,
    @InjectSignerProvider()
    private readonly ethersSigner: EthersSigner,
    @InjectContractProvider()
    private readonly ethersContract: EthersContract,
    @InjectRepository(JobEntity)
    private readonly jobEntityRepository: Repository<JobEntity>,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.recordingOracleAddress = this.configService.get<string>(
      "RECORDING_ORACLE_ADDRESS", ""
    );
    this.reputationOracleAddress = this.configService.get<string>(
      "REPUTATION_ORACLE_ADDRESS", ""
    );
    this.exchangeOracleAddress = this.configService.get<string>(
      "EXCHANGE_ORACLE_ADDRESS", ""
    );
    this.recordingOracleUrl = this.configService.get<string>("RECORDING_ORACLE_URL", "");
    this.reputationOracleUrl = this.configService.get<string>("REPUTATION_ORACLE_URL", "");
    this.exchangeOracleUrl = this.configService.get<string>("EXCHANGE_ORACLE_URL", "");
    this.recordingOracleStake = this.configService.get<number>("RECORDING_ORACLE_STAKE", 0);
    this.reputationOracleStake = this.configService.get<number>("REPUTATION_ORACLE_STAKE", 0);
  }

  public async getLiquidity(): Promise<ILiquidityDto[]> {
    const jobLauncherPK = this.configService.get<string>("WEB3_JOB_LAUNCHER_PRIVATE_KEY", "");
    const operator: Wallet = this.ethersSigner.createWallet(jobLauncherPK);
    
    return Promise.all(networks.map(async network => {
      const contractProvider = new EthersContract(new StaticJsonRpcProvider(network.rpcUrl, network.network))
      const token: Contract = await contractProvider.create(
        networkMap.mumbai.hmtAddress,
        HMToken.abi
      );
      
      const liquidity = (await token.connect(operator).balanceOf(network.defaultStakingAddress)).toString();

      return {
        network: network,
        liquidity: Number(ethers.utils.formatEther(liquidity)),
        symbol: "HMT",
      }
    }));
  }

  public async getJobByUser(userId: number): Promise<JobEntity[]> {
    return this.jobEntityRepository.find({
      where: {
        userId
      },
      order: {
        createdAt: SortDirection.ASC,
      },
    });
  }

  public async getJobById(jobId: number): Promise<IJobDto> {
    const jobEntity = await this.findOne({ id: jobId });

    if (!jobEntity) throw new NotFoundException("Job not found");

    const bucket: IBucketDto = await this.storageService.getBucketInfo(jobEntity.dataUrl)

    return jobFormatter(jobEntity, bucket);
  }

  public async getJobByStatus(status: JobStatus): Promise<JobEntity[]> {
    const results = await this.jobEntityRepository.find({
      where: {
        status
      },
      order: {
        createdAt: SortDirection.ASC,
      },
    });

    if (results && results.length === 0) throw new NotFoundException(`Jobs with status ${status} not found`);

    return results;
  }

  public async getFeeRange(): Promise<IJobFeeRangeDto> {
    const jobEntities = await this.jobEntityRepository.find({
      where: {
        status: JobStatus.PAID
      }
    });

    const fees = jobEntities.map((jobEntity: JobEntity) => {
      return jobEntity.fee
    })

    return {
      min: min(fees) || 0,
      avg: avg(fees) || 0,
      max: max(fees) || 0
    }
  }

  public async approve(jobId: number, dto: IJobApproveDto, userId: number): Promise<boolean> {
    const jobEntity = await this.findOne({ id: jobId });

    if (!jobEntity) throw new NotFoundException("Job not found");

    const transaction = await this.ethersProvider.getTransactionReceipt(dto.transactionHash);
    if (!transaction) throw new NotFoundException("Transaction not found by hash");

    if (transaction.confirmations < CONFIRMATION_TRESHOLD) {
      this.logger.error(`Transaction has ${transaction.confirmations} confirmations instead of ${CONFIRMATION_TRESHOLD}`)
      throw new NotFoundException("Transaction has not enough amount of confirmations");
    } 

    const jobLauncherPK = this.configService.get<string>("WEB3_JOB_LAUNCHER_PRIVATE_KEY", "");
    const operator: Wallet = this.ethersSigner.createWallet(jobLauncherPK);

    const escrow: Contract = this.ethersContract.create(
      jobEntity.escrowAddress,
      Escrow.abi
    );
      
    if (JobStatus.PENDING !== jobEntity.status) {
      throw new BadRequestException(`Escrow does not to have right status`);
    }

    const escrowBalanceWei = await escrow
      .connect(operator)
      .getBalance()
    const escrowBalanceEth = escrowBalanceWei ? Number(ethers.utils.formatEther(escrowBalanceWei)) : 0;
    
    const { annotationsPerImage, datasetLength, price } = jobEntity;
    const amountRequire = price * datasetLength * annotationsPerImage;

    if (escrowBalanceEth < amountRequire) {
      throw new BadRequestException(`Insufficient escrow balance. Required ammount: ${amountRequire} HMT. Current balance: ${escrowBalanceEth} HMT`);
    }

    const jobLauncherUrl = this.configService.get<string>("JOB_LAUNCHER_URL");

    const exchangeOracleUrl = this.configService.get<string>("EXCHANGE_ORACLE_URL");

    try {
      const result = await firstValueFrom(
        this.httpService.post(`${exchangeOracleUrl}/job`, {
          manifest_url: `${jobLauncherUrl}/job/${jobId}/manifest`,
          escrow_address: jobEntity.escrowAddress,
          network: jobEntity.networkId
        }),
      );

      if (!result) return false;
    
      Object.assign(jobEntity, { status: JobStatus.PAID });
      jobEntity.save();

      return true;
    } catch(e) {
      throw new BadRequestException(`Unable to get response from Exchange Oracle`);
    }
  }

  public async create(dto: IJobCreateDto, userId: number): Promise<IJobDto> {
    const { dataUrl, groundTruthFileUrl, fee, } = dto;

    const networkId = NetworkId.LOCAL_GANACHE;

    if (!await this.storageService.isBucketValid(dataUrl)) {
      throw new BadGatewayException("Bucket does not to have right permissions");
    }

    if (groundTruthFileUrl) {
      if (!await this.storageService.isFileValid(groundTruthFileUrl)) {
        this.logger.debug("File does not to have right permissions")
        throw new BadGatewayException("File does not to have right permissions");
      }

      const groundTruthData = await this.storageService.getFileFromUrl(groundTruthFileUrl);

      if (!await this.isGroundTruthDataValid(groundTruthData)) {
        this.logger.debug("Ground truth data is not valid")
        throw new BadGatewayException("Ground truth data is not valid");
      }
    }
    
    const data = await this.storageService.getDataFromBucket(dataUrl, EXCLUDED_BUCKET_FILENAMES);
    if (data && Array.isArray(data) && data.length === 0) {
      throw new BadGatewayException("No data in the bucket");
    }
    
    // TODO: Check that transaction in HMT 
    // TODO: Return suggested price price = amount of images * requests / amout of HMT

    const manifest: IJobManifestDto = {
      data: JSON.stringify(data),
      dataUrl,
      datasetLength: data.length,
      recordingOracleAddress: this.recordingOracleAddress,
      reputationOracleAddress: this.reputationOracleAddress,
      exchangeOracleAddress: this.exchangeOracleAddress,
      recordingOracleUrl: this.recordingOracleUrl,
      reputationOracleUrl: this.reputationOracleUrl,
      exchangeOracleUrl: this.exchangeOracleUrl,
      recordingOracleStake: this.recordingOracleStake,
      reputationOracleStake: this.reputationOracleStake,
      annotationsPerImage: dto.annotationsPerImage,
      labels: dto.labels,
      requesterDescription: dto.requesterDescription,
      requesterAccuracyTarget: dto.requesterAccuracyTarget,
      price: dto.price,
      mode: JobMode.BATCH,
      requestType: JobRequestType.IMAGE_LABEL_BINARY,
    };

    const manifestHash = crypto.createHash("sha256").update(manifest.toString()).digest("hex");

    const jobEntity = await this.jobEntityRepository
      .create({
        ...manifest,
        fee,
        networkId,
        userId,
        manifestHash,
        tokenAddress: this.configService.get<string>("WEB3_HMT_TOKEN", ""),
        status: JobStatus.PENDING,
      })
      .save();

    if (!jobEntity) throw new NotFoundException("Job was not created");
    
    const escrowAddress = await this.createEscrow(jobEntity);
    Object.assign(jobEntity, { escrowAddress })
    await jobEntity.save();

    const bucket: IBucketDto = await this.storageService.getBucketInfo(jobEntity.dataUrl)

    return jobFormatter(jobEntity, bucket);
  }

  public async createEscrow(jobEntity: JobEntity): Promise<string> {
    const jobLauncherPK = this.configService.get<string>("WEB3_JOB_LAUNCHER_PRIVATE_KEY", "");
    const operator: Wallet = this.ethersSigner.createWallet(jobLauncherPK);

    const escrowFactory: Contract = this.ethersContract.create(
      this.configService.get<string>("WEB3_ESCROW_FACTORY_ADDRESS", ""),
      EscrowFactory.abi
    );

    const gasLimit = await escrowFactory.connect(operator).estimateGas
      .createEscrow([
        jobEntity.reputationOracleAddress,
        jobEntity.recordingOracleAddress
      ])
    const gasPrice = await this.ethersProvider.getGasPrice();

    const result: any = await (
      await escrowFactory
        .connect(operator)
        .createEscrow([
          jobEntity.reputationOracleAddress,
          jobEntity.recordingOracleAddress
        ], { gasLimit: gasLimit, gasPrice })
    ).wait()

    if (!result?.events[0]?.transactionHash) {
      throw new BadGatewayException("Transaction hash related with createEscrow method does not exists");
    }

    const escrowAddress = await escrowFactory.lastEscrow()

    if (!escrowAddress) {
      throw new BadGatewayException("Escrow does not exists");
    }

    this.logger.debug("Escrow Address: ", escrowAddress);
    
    return escrowAddress;
  }

  public async setupEscrow(jobEntity: JobEntity): Promise<JobEntity> {
    if (!jobEntity.escrowAddress) {
      this.logger.debug(`Escrow address does not exists for job with id ${jobEntity.id}`);
      Object.assign(jobEntity, { status: JobStatus.REJECTED });
      await jobEntity.save();
      throw new NotFoundException("Escrow address does not exists");
    }

    const jobLauncherPK = this.configService.get<string>("WEB3_JOB_LAUNCHER_PRIVATE_KEY", "");
    const operator: Wallet = this.ethersSigner.createWallet(jobLauncherPK);

    const escrow: Contract = this.ethersContract.create(
      jobEntity.escrowAddress,
      Escrow.abi
    );

    const jobLauncherUrl = this.configService.get<string>("JOB_LAUNCHER_URL", "");
    const manifestUrl = `${jobLauncherUrl}/job/${jobEntity.id}/manifest`

    const result: any = await (
      await escrow
        .connect(operator)
        .setup(
          jobEntity.reputationOracleAddress,
          jobEntity.recordingOracleAddress,
          jobEntity.reputationOracleStake,
          jobEntity.recordingOracleStake,
          manifestUrl,
          jobEntity.manifestHash
        )
    ).wait()

    Object.assign(jobEntity, { status: JobStatus.ESCROW_SETUP });
    await jobEntity.save();

    this.logger.debug("Escrow address was setup with result: ", result);
    
    return jobEntity;
  }

  public findOne(
    where: FindConditions<JobEntity>,
    options?: FindOneOptions<JobEntity>,
  ): Promise<JobEntity | undefined> {
    return this.jobEntityRepository.findOne({ where, ...options });
  }

  public find(where: FindConditions<JobEntity>, options?: FindManyOptions<JobEntity>): Promise<JobEntity[]> {
    return this.jobEntityRepository.find({
      where,
      order: {
        createdAt: SortDirection.DESC,
      },
      ...options,
    });
  }

  public async getManifest(jobId: number): Promise<IManifestDto> {
    const jobEntity = await this.findOne({ id: jobId });

    if (!jobEntity) throw new NotFoundException("Job not found");

    const bucket: IBucketDto = await this.storageService.getBucketInfo(jobEntity.dataUrl)

    return manifestFormatter(jobEntity, bucket);
  }

  public async getDataSample(jobId: number): Promise<IManifestDataItemDto[]> {
    const jobEntity = await this.findOne({ id: jobId });

    if (!jobEntity) throw new NotFoundException("Job not found");

    const data = JSON.parse(jobEntity.data)

    return this.getRandomSample(data, DATA_SAMPLE_SIZE);
  }

  private getRandomSample(data: IManifestDataItemDto[], n: number): IManifestDataItemDto[] {
    const length = data == null ? 0 : data.length
    if (!length || n < 1) {
        return []
        }
        n = n > length ? length : n

        let index = -1
        const result = data.slice()
        
        while (++index < n) {
            const rand = index + Math.floor(Math.random() * (length - index ))
            
            const value = result[rand]
            result[rand] = result[index]
            result[index] = value
        }

        return result.slice(0,n)
  }

  private isGroundTruthDataValid(groundTruthData: any) {
    if (Array.isArray(groundTruthData.images) && groundTruthData.images.length === 0) {
      this.logger.debug("Images array is empty")
      // throw new NotFoundException("Images array is empty");
      return false
    }

    if (Array.isArray(groundTruthData.annotations) && groundTruthData.annotations.length === 0) {
      this.logger.debug("Anotations array is empty")
      // throw new NotFoundException("Anotations array is empty");
      return false
    }

    if (groundTruthData.images.length !== groundTruthData.annotations.length) {
      this.logger.debug("Images and Anotations has different size")
      // throw new NotFoundException("Images and Anotations has different size");
      return false
    }

    groundTruthData.images.forEach((image: any, index: number) => {
      if (!isAnGroundTruthDataImage(image)) {
        this.logger.debug(`Object with index ${index} has incorrect implementation`)
        // throw new NotFoundException(`Object with index ${index} has incorrect implementation`);
      }
    })

    groundTruthData.annotations.forEach((annotation: any, index: number) => { 
      if (isAnGroundTruthDataAnnotations(annotation)) {
        this.logger.debug(`Object with index ${index} has incorrect implementation`)
        // throw new NotFoundException(`Object with index ${index} has incorrect implementation`);
      }
    })

    return true;
  }
}