import { HttpService } from "@nestjs/axios";
import { BadGatewayException, BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { EscrowClient, EscrowStatus, StorageClient, StorageCredentials, StorageParams, UploadFile } from "@human-protocol/sdk";
import { ethers } from "ethers";

import { ServerConfigType, S3ConfigType, serverConfigKey, s3ConfigKey } from "../../common/config";
import { JobSolutionRequestDto, SaveSoulutionsDto, SendWebhookDto } from "./job.dto";
import { Web3Service } from "../web3/web3.service";
import { ErrorBucket, ErrorJob } from "../../common/constants/errors";
import { firstValueFrom } from "rxjs";
import { JobRequestType } from "../../common/enums/job";
import { IManifest, ISolution } from "../../common/interfaces/job";

@Injectable()
export class JobService {
  public readonly logger = new Logger(JobService.name);
  public readonly storageClient: StorageClient;
  public readonly storageParams: StorageParams;

  constructor(
    @Inject(s3ConfigKey)
    private s3Config: S3ConfigType,
    @Inject(serverConfigKey)
    private serverConfig: ServerConfigType,
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    private readonly httpService: HttpService,
  ) {
    const storageCredentials: StorageCredentials = {
      accessKey: this.s3Config.accessKey,
      secretKey: this.s3Config.secretKey,
    };

    this.storageParams = {
      endPoint: this.s3Config.accessKey,
      port: this.s3Config.port,
      useSSL: this.s3Config.useSSL,
    };

    this.storageClient = new StorageClient(
      storageCredentials,
      this.storageParams,
    );
  }

  async processJobSolution(jobSolution: JobSolutionRequestDto): Promise<string> {
    const signer = this.web3Service.getSigner(jobSolution.chainId);
    const escrowClient = await EscrowClient.build(signer);
  
    const recordingOracleAddress = await escrowClient.getRecordingOracleAddress(jobSolution.escrowAddress);
    if (ethers.utils.getAddress(recordingOracleAddress) !== (await signer.getAddress())) {
      this.logger.log(ErrorJob.AddressMismatches, JobService.name);
      throw new BadRequestException(ErrorJob.AddressMismatches);
    }
  
    const escrowStatus = await escrowClient.getStatus(jobSolution.escrowAddress);
    if (escrowStatus !== EscrowStatus.Pending) {
      this.logger.log(ErrorJob.InvalidStatus, JobService.name);
      throw new BadRequestException(ErrorJob.InvalidStatus);
    }
  
    const manifestUrl = await escrowClient.getManifestUrl(jobSolution.escrowAddress);
    const { submissionsRequired, requestType }: IManifest = await StorageClient.downloadFileFromUrl(manifestUrl)

    if (!submissionsRequired || !requestType) {
      this.logger.log(ErrorJob.InvalidManifest, JobService.name);
      throw new BadRequestException(ErrorJob.InvalidManifest);
    }
  
    if (requestType !== JobRequestType.FORTUNE) {
      this.logger.log(ErrorJob.InvalidJobType, JobService.name);
      throw new BadRequestException(ErrorJob.InvalidJobType);
    }

    // TODO: Develop a generic error handler for ethereum errors
    const existingJobSolutionsURL = await escrowClient.getIntermediateResultsUrl(jobSolution.escrowAddress);
    const existingJobSolutions: ISolution[] = await StorageClient.downloadFileFromUrl(existingJobSolutionsURL)
  
    if (existingJobSolutions.find(({ solution }) => solution === jobSolution.solution)) {
      this.logger.log(ErrorJob.SolutionAlreadyExists, JobService.name);
      throw new BadRequestException(ErrorJob.SolutionAlreadyExists);
    }
  
    const newJobSolutions: ISolution[] = [
      ...existingJobSolutions,
      {
        exchangeAddress: jobSolution.exchangeAddress,
        workerAddress: jobSolution.workerAddress,
        solution: jobSolution.solution,
      },
    ];

    if (newJobSolutions.length > submissionsRequired) {
      this.logger.log(ErrorJob.AllSolutionsHaveAlreadyBeenSent, JobService.name);
      throw new BadRequestException(ErrorJob.AllSolutionsHaveAlreadyBeenSent);
    }
  
    const jobSolutionUploaded = await this.uploadJobSolutions(newJobSolutions, this.s3Config.bucket);

    if (!existingJobSolutionsURL) {
      await escrowClient.storeResults(jobSolution.escrowAddress, jobSolutionUploaded.url, jobSolutionUploaded.hash);
    }
  
    // TODO: Uncomment this to read reputation oracle URL from KVStore
    // const reputationOracleAddress = await escrowClient.getReputationOracleAddress(jobSolution.escrowAddress);
    // const reputationOracleURL = (await kvstoreClient.get(reputationOracleAddress, "url")) as string;

    // TODO: Remove this when KVStore is used
    if (newJobSolutions.length === submissionsRequired) {
      await this.sendWebhook(
        this.serverConfig.reputationOracleWebhookUrl, 
        { chainId: jobSolution.chainId, escrowAddress: jobSolution.escrowAddress }
      );

      return "The requested job is completed.";
    }
  
    return "Solution is recorded.";
  }

  private async uploadJobSolutions(jobSolutions: any[], bucket: string): Promise<SaveSoulutionsDto> {  
    const uploadedFiles: UploadFile[] = await this.storageClient.uploadFiles(jobSolutions, bucket);

    if (!uploadedFiles[0]) {
      this.logger.log(ErrorBucket.UnableSaveFile, JobService.name);
      throw new BadGatewayException(ErrorBucket.UnableSaveFile);
    }

    return uploadedFiles[0];
  }
  
  public async sendWebhook(webhookUrl: string, webhookData: SendWebhookDto): Promise<boolean> {
    const { data } = await firstValueFrom(
      await this.httpService.post(webhookUrl, webhookData)
    );
    
    if (!data) {
      this.logger.log(ErrorJob.WebhookWasNotSent, JobService.name);
      throw new NotFoundException(ErrorJob.WebhookWasNotSent);
    }

    return true;
  }
}
