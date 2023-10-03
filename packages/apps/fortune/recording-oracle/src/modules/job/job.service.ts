import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  EscrowClient,
  EscrowStatus,
  KVStoreClient,
  StorageClient,
} from '@human-protocol/sdk';
import { ethers } from 'ethers';
import * as Minio from 'minio';
import { uploadJobSolutions } from '../../common/utils/storage';

import {
  ServerConfigType,
  S3ConfigType,
  serverConfigKey,
  s3ConfigKey,
} from '../../common/config';
import { JobSolutionRequestDto, SendWebhookDto } from './job.dto';
import { Web3Service } from '../web3/web3.service';
import { ErrorJob } from '../../common/constants/errors';
import { firstValueFrom } from 'rxjs';
import { JobRequestType } from '../../common/enums/job';
import { IManifest, ISolution } from '../../common/interfaces/job';
import { checkCurseWords } from '@/common/utils/curseWords';

@Injectable()
export class JobService {
  public readonly logger = new Logger(JobService.name);
  public readonly minioClient: Minio.Client;

  constructor(
    @Inject(s3ConfigKey)
    private s3Config: S3ConfigType,
    @Inject(serverConfigKey)
    private serverConfig: ServerConfigType,
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    private readonly httpService: HttpService,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: this.s3Config.endPoint,
      port: this.s3Config.port,
      accessKey: this.s3Config.accessKey,
      secretKey: this.s3Config.secretKey,
      useSSL: this.s3Config.useSSL,
    });
  }

  private getUniqueSolutions(
    listA: ISolution[],
    listB: ISolution[],
  ): ISolution[] {
    return listA.filter(
      (solution) =>
        !listB.some((compareSolution) =>
          Object.keys(solution).every(
            (key) =>
              solution[key as keyof ISolution] ===
              compareSolution[key as keyof ISolution],
          ),
        ),
    );
  }

  private processSolutions(
    exchangeSolutions: ISolution[],
    recordingSolutions: ISolution[],
  ) {
    const errorSolutions: ISolution[] = [];
    let uniqueSolutions: ISolution[] = exchangeSolutions;

    const duplicatedInExchange = exchangeSolutions.filter((solution, index) =>
      exchangeSolutions
        .slice(index + 1)
        .some(
          (compareSolution) =>
            solution.exchangeAddress === compareSolution.exchangeAddress &&
            solution.workerAddress === compareSolution.workerAddress &&
            solution.solution === compareSolution.solution,
        ),
    );

    if (duplicatedInExchange) errorSolutions.push(...duplicatedInExchange);

    uniqueSolutions = this.getUniqueSolutions(
      exchangeSolutions,
      duplicatedInExchange,
    );
    uniqueSolutions.push(...errorSolutions);

    const duplicatedInRecording = uniqueSolutions.filter((solution) =>
      recordingSolutions.some(
        (compareSolution) =>
          solution.exchangeAddress === compareSolution.exchangeAddress &&
          solution.workerAddress === compareSolution.workerAddress &&
          solution.solution === compareSolution.solution,
      ),
    );

    uniqueSolutions = this.getUniqueSolutions(
      uniqueSolutions,
      duplicatedInRecording,
    );

    uniqueSolutions = uniqueSolutions.filter((solution) => {
      if (checkCurseWords(solution.solution)) {
        errorSolutions.push(solution);
        return false;
      }
      return true;
    });

    return { errorSolutions, uniqueSolutions };
  }

  async processJobSolution(
    jobSolution: JobSolutionRequestDto,
  ): Promise<string> {
    const signer = this.web3Service.getSigner(jobSolution.chainId);
    const escrowClient = await EscrowClient.build(signer);
    const kvstoreClient = await KVStoreClient.build(signer);

    const recordingOracleAddress = await escrowClient.getRecordingOracleAddress(
      jobSolution.escrowAddress,
    );
    if (
      ethers.utils.getAddress(recordingOracleAddress) !==
      (await signer.getAddress())
    ) {
      this.logger.log(ErrorJob.AddressMismatches, JobService.name);
      throw new BadRequestException(ErrorJob.AddressMismatches);
    }

    const escrowStatus = await escrowClient.getStatus(
      jobSolution.escrowAddress,
    );
    if (
      escrowStatus !== EscrowStatus.Pending &&
      escrowStatus !== EscrowStatus.Partial
    ) {
      this.logger.log(ErrorJob.InvalidStatus, JobService.name);
      throw new BadRequestException(ErrorJob.InvalidStatus);
    }

    const manifestUrl = await escrowClient.getManifestUrl(
      jobSolution.escrowAddress,
    );
    const { submissionsRequired, requestType }: IManifest =
      await StorageClient.downloadFileFromUrl(manifestUrl);

    if (!submissionsRequired || !requestType) {
      this.logger.log(ErrorJob.InvalidManifest, JobService.name);
      throw new BadRequestException(ErrorJob.InvalidManifest);
    }

    if (requestType !== JobRequestType.FORTUNE) {
      this.logger.log(ErrorJob.InvalidJobType, JobService.name);
      throw new BadRequestException(ErrorJob.InvalidJobType);
    }

    const existingJobSolutionsURL =
      await escrowClient.getIntermediateResultsUrl(jobSolution.escrowAddress);

    let existingJobSolutions: ISolution[];
    try {
      existingJobSolutions = await StorageClient.downloadFileFromUrl(
        `http://127.0.0.1:9000/solution/${jobSolution.escrowAddress}-${jobSolution.chainId}.json`,
      );
    } catch {
      existingJobSolutions = [];
    }

    const exchangeJobSolutions: ISolution[] =
      await StorageClient.downloadFileFromUrl(jobSolution.solutionUrl);

    const { errorSolutions, uniqueSolutions } = this.processSolutions(
      exchangeJobSolutions,
      existingJobSolutions,
    );

    const newJobSolutions: ISolution[] = [
      ...existingJobSolutions,
      ...uniqueSolutions,
    ];

    if (newJobSolutions.length > submissionsRequired) {
      this.logger.log(
        ErrorJob.AllSolutionsHaveAlreadyBeenSent,
        JobService.name,
      );
      throw new BadRequestException(ErrorJob.AllSolutionsHaveAlreadyBeenSent);
    }

    const jobSolutionUploaded = await uploadJobSolutions(
      this.minioClient,
      jobSolution.chainId,
      jobSolution.escrowAddress,
      newJobSolutions,
      this.s3Config.bucket,
    );

    if (!existingJobSolutionsURL) {
      await escrowClient.storeResults(
        jobSolution.escrowAddress,
        jobSolutionUploaded.url,
        jobSolutionUploaded.hash,
      );
    }

    // TODO: Uncomment this to read reputation oracle URL from KVStore
    // const reputationOracleAddress = await escrowClient.getReputationOracleAddress(jobSolution.escrowAddress);
    // const reputationOracleURL = (await kvstoreClient.get(reputationOracleAddress, "url")) as string;

    // TODO: Remove this when KVStore is used

    if (newJobSolutions.length === submissionsRequired) {
      await this.sendWebhook(this.serverConfig.reputationOracleWebhookUrl, {
        chainId: jobSolution.chainId,
        escrowAddress: jobSolution.escrowAddress,
      });

      return 'The requested job is completed.';
    }
    if (errorSolutions.length) {
      const exchangeOracleURL = (await kvstoreClient.get(
        jobSolution.exchangeAddress,
        'webhook_url',
      )) as string;
      for (const solution of errorSolutions) {
        await this.sendWebhook(exchangeOracleURL + '/invalid-solution', {
          chainId: jobSolution.chainId,
          escrowAddress: jobSolution.escrowAddress,
          solution,
        });
      }
    }

    return 'Solution are recorded.';
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
