import { EscrowClient, EscrowStatus, KVStoreClient } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ethers } from 'ethers';
import * as Minio from 'minio';

import { ServerConfigType, serverConfigKey } from '../../common/config';
import { ErrorJob } from '../../common/constants/errors';
import { JobRequestType } from '../../common/enums/job';
import {
  IManifest,
  ISolution,
  ISolutionsFile,
} from '../../common/interfaces/job';
import { checkCurseWords } from '../../common/utils/curseWords';
import { sendWebhook } from '../../common/utils/webhook';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { JobSolutionsRequestDto } from './job.dto';
import { EXCHANGE_INVALID_ENDPOINT } from '../../common/constants';

@Injectable()
export class JobService {
  public readonly logger = new Logger(JobService.name);
  public readonly minioClient: Minio.Client;

  constructor(
    @Inject(serverConfigKey)
    private serverConfig: ServerConfigType,
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    @Inject(StorageService)
    private readonly storageService: StorageService,
    private readonly httpService: HttpService,
  ) {}

  private processSolutions(
    exchangeSolutions: ISolution[],
    recordingSolutions: ISolution[],
  ) {
    const errorSolutions: ISolution[] = [];
    const uniqueSolutions: ISolution[] = [];

    const filteredExchangeSolution = exchangeSolutions.filter(
      (exchangeSolution) => !exchangeSolution.invalid,
    );

    filteredExchangeSolution.forEach((exchangeSolution) => {
      if (errorSolutions.includes(exchangeSolution)) return;
      const duplicatedInExchange = filteredExchangeSolution.filter(
        (solution) =>
          solution.workerAddress === exchangeSolution.workerAddress ||
          solution.solution === exchangeSolution.solution,
      );
      if (duplicatedInExchange.length > 1) {
        duplicatedInExchange.forEach((duplicated) => {
          if (
            (duplicated.solution !== exchangeSolution.solution ||
              duplicated.workerAddress !== exchangeSolution.workerAddress) &&
            !errorSolutions.includes(duplicated)
          ) {
            errorSolutions.push(duplicated);
          }
        });
      }

      const duplicatedInRecording = recordingSolutions.filter(
        (solution) =>
          solution.workerAddress === exchangeSolution.workerAddress ||
          solution.solution === exchangeSolution.solution,
      );

      if (duplicatedInRecording.length === 0) {
        if (checkCurseWords(exchangeSolution.solution))
          errorSolutions.push(exchangeSolution);
        else uniqueSolutions.push(exchangeSolution);
      }
    });
    return { errorSolutions, uniqueSolutions };
  }

  async processJobSolution(
    jobSolution: JobSolutionsRequestDto,
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
      await this.storageService.download(manifestUrl);

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

    const existingJobSolutions = await this.storageService.download(
      this.storageService.getJobUrl(
        jobSolution.escrowAddress,
        jobSolution.chainId,
      ),
    );

    if (existingJobSolutions.length >= submissionsRequired) {
      this.logger.log(
        ErrorJob.AllSolutionsHaveAlreadyBeenSent,
        JobService.name,
      );
      throw new BadRequestException(ErrorJob.AllSolutionsHaveAlreadyBeenSent);
    }

    const exchangeJobSolutionsFile: ISolutionsFile =
      await this.storageService.download(jobSolution.solutionsUrl);

    const { errorSolutions, uniqueSolutions } = this.processSolutions(
      exchangeJobSolutionsFile.solutions,
      existingJobSolutions,
    );

    const newJobSolutions: ISolution[] = [
      ...existingJobSolutions,
      ...uniqueSolutions,
    ];

    const jobSolutionUploaded = await this.storageService.uploadJobSolutions(
      jobSolution.escrowAddress,
      jobSolution.chainId,
      newJobSolutions,
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

    if (newJobSolutions.length >= submissionsRequired) {
      await sendWebhook(
        this.httpService,
        this.logger,
        this.serverConfig.reputationOracleWebhookUrl,
        {
          chainId: jobSolution.chainId,
          escrowAddress: jobSolution.escrowAddress,
        },
      );

      return 'The requested job is completed.';
    }
    if (errorSolutions.length) {
      const exchangeOracleURL = (await kvstoreClient.get(
        exchangeJobSolutionsFile.exchangeAddress,
        'webhook_url',
      )) as string;
      for (const solution of errorSolutions) {
        await sendWebhook(
          this.httpService,
          this.logger,
          exchangeOracleURL + EXCHANGE_INVALID_ENDPOINT,
          {
            chainId: jobSolution.chainId,
            escrowAddress: jobSolution.escrowAddress,
            workerAddress: solution.workerAddress,
          },
        );
      }
    }

    return 'Solution are recorded.';
  }
}
