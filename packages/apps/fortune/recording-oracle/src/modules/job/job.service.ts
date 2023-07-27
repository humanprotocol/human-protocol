import { HttpService } from "@nestjs/axios";
import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { EscrowClient, EscrowStatus, StorageClient } from "@human-protocol/sdk";
import { ethers } from "ethers";

import { serverConfigKey, ServerConfigType, storageConfigKey, StorageConfigType } from "@/common/config";
import { JobSolutionRequestDto, SendWebhookDto } from "./job.dto";
import { Web3Service } from "../web3/web3.service";
import { ErrorJob } from "../../common/constants/errors";
import { firstValueFrom } from "rxjs";
import { JobRequestType } from "../../common/enums/job";
import { IManifest, ISolution } from "../../common/interfaces/job";

@Injectable()
export class JobService {
  public readonly logger = new Logger(JobService.name);

  constructor(
    @Inject(storageConfigKey)
    private storageConfig: StorageConfigType,
    @Inject(serverConfigKey)
    private serverConfig: ServerConfigType,
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    private readonly httpService: HttpService,
  ) {}

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
    const { submissionsRequired, requestType }: IManifest = await StorageClient.downloadFileFromUrl(manifestUrl);
  
    if (!submissionsRequired || !requestType) {
      this.logger.log(ErrorJob.InvalidManifest, JobService.name);
      throw new BadRequestException(ErrorJob.InvalidManifest);
    }
  
    if (requestType !== JobRequestType.FORTUNE) {
      this.logger.log(ErrorJob.InvalidJobType, JobService.name);
      throw new BadRequestException(ErrorJob.InvalidJobType);
    }
  
    const bucket = this.storageConfig.bucket;
    // TODO: Develop a generic error handler for ethereum errors
    const existingJobSolutionsURL = await escrowClient.getIntermediateResultsUrl(jobSolution.escrowAddress);
    const existingJobSolutions: ISolution[] = await StorageClient.downloadFileFromUrl(existingJobSolutionsURL).catch(() => []);
  
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
  
    const [jobSolutionUploaded] = await this.uploadJobSolutions(newJobSolutions, bucket);

    if (!existingJobSolutionsURL) {
      await escrowClient.storeResults(jobSolution.escrowAddress, jobSolutionUploaded.url, jobSolutionUploaded.hash);
    }
  
    // TODO: Uncomment this to read reputation oracle URL from KVStore
    // const reputationOracleAddress = await escrowClient.getReputationOracleAddress(jobSolution.escrowAddress);
    // const reputationOracleURL = (await kvstoreClient.get(reputationOracleAddress, "url")) as string;

    // TODO: Remove this when KVStore is used
    const reputationOracleURL = this.serverConfig.reputationOracleURL;
    if (newJobSolutions.length === submissionsRequired) {
      await this.sendWebhook(reputationOracleURL, {
        chainId: jobSolution.chainId, escrowAddress: jobSolution.escrowAddress
      });

      return "The requested job is completed.";
    }
  
    return "Solution is recorded.";
  }
  
  private async uploadJobSolutions(jobSolutions: any[], bucket: string): Promise<{ url: string; hash: string }[]> {
    const storageClient = new StorageClient(
      {
        accessKey: this.storageConfig.accessKey,
        secretKey: this.storageConfig.secretKey,
      },
      {
        endPoint: this.storageConfig.endPoint,
        port: this.storageConfig.port,
        useSSL: this.storageConfig.useSSL,
      },
    );
  
    return storageClient.uploadFiles(jobSolutions, bucket);
  }
  
  private async sendWebhook(webhookUrl: string, webhookData: SendWebhookDto): Promise<boolean> {
    const { data } = await firstValueFrom(
      this.httpService.post(webhookUrl, webhookData)
    );

    if (!data) {
      this.logger.log(ErrorJob.WebhookWasNotSent, JobService.name);
      throw new NotFoundException(ErrorJob.WebhookWasNotSent);
    }

    return true;
  }
}
