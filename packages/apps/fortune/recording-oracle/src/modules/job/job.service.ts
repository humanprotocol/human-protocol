import {
  EscrowClient,
  EscrowStatus,
  KVStoreKeys,
  KVStoreUtils,
} from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import * as Minio from 'minio';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ErrorJob } from '../../common/constants/errors';
import { JobRequestType, SolutionError } from '../../common/enums/job';
import { EventType } from '../../common/enums/webhook';
import { ConflictError, ValidationError } from '../../common/errors';
import { IManifest, ISolution } from '../../common/interfaces/job';
import { checkCurseWords } from '../../common/utils/curseWords';
import { sendWebhook } from '../../common/utils/webhook';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import {
  AssignmentRejection,
  SolutionEventData,
  WebhookDto,
} from '../webhook/webhook.dto';

@Injectable()
export class JobService {
  public readonly logger = new Logger(JobService.name);
  public readonly minioClient: Minio.Client;

  constructor(
    private web3ConfigService: Web3ConfigService,
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
      (exchangeSolution) => !exchangeSolution.error,
    );

    filteredExchangeSolution.forEach((exchangeSolution) => {
      if (errorSolutions.includes(exchangeSolution)) return;
      const duplicatedInUnique = uniqueSolutions.filter(
        (solution) =>
          solution.workerAddress === exchangeSolution.workerAddress ||
          solution.solution === exchangeSolution.solution,
      );
      if (
        duplicatedInUnique.length > 0 &&
        !errorSolutions.includes(exchangeSolution)
      ) {
        errorSolutions.push({
          ...exchangeSolution,
          error: SolutionError.Duplicated,
        });
        return;
      }

      const duplicatedInRecording = recordingSolutions.filter(
        (solution) =>
          solution.workerAddress === exchangeSolution.workerAddress &&
          solution.solution === exchangeSolution.solution,
      );

      if (duplicatedInRecording.length === 0) {
        if (checkCurseWords(exchangeSolution.solution))
          errorSolutions.push({
            ...exchangeSolution,
            error: SolutionError.CurseWord,
          });
        else uniqueSolutions.push(exchangeSolution);
      } else uniqueSolutions.push(exchangeSolution);
    });
    return { errorSolutions, uniqueSolutions };
  }

  async processJobSolution(webhook: WebhookDto): Promise<string> {
    const signer = this.web3Service.getSigner(webhook.chainId);
    const escrowClient = await EscrowClient.build(signer);

    const recordingOracleAddress = await escrowClient.getRecordingOracleAddress(
      webhook.escrowAddress,
    );
    if (
      ethers.getAddress(recordingOracleAddress) !== (await signer.getAddress())
    ) {
      this.logger.log(ErrorJob.AddressMismatches, JobService.name);
      throw new ValidationError(ErrorJob.AddressMismatches);
    }

    const escrowStatus = await escrowClient.getStatus(webhook.escrowAddress);
    if (
      escrowStatus !== EscrowStatus.Pending &&
      escrowStatus !== EscrowStatus.Partial
    ) {
      this.logger.log(ErrorJob.InvalidStatus, JobService.name);
      throw new ConflictError(ErrorJob.InvalidStatus);
    }

    const manifestUrl = await escrowClient.getManifestUrl(
      webhook.escrowAddress,
    );
    const { submissionsRequired, requestType }: IManifest =
      await this.storageService.download(manifestUrl);

    if (!submissionsRequired || !requestType) {
      this.logger.log(ErrorJob.InvalidManifest, JobService.name);
      throw new ValidationError(ErrorJob.InvalidManifest);
    }

    if (requestType !== JobRequestType.FORTUNE) {
      this.logger.log(ErrorJob.InvalidJobType, JobService.name);
      throw new ValidationError(ErrorJob.InvalidJobType);
    }

    const existingJobSolutionsURL =
      await escrowClient.getIntermediateResultsUrl(webhook.escrowAddress);

    let existingJobSolutions: ISolution[] = [];
    if (existingJobSolutionsURL) {
      existingJobSolutions = await this.storageService.download(
        existingJobSolutionsURL,
      );
    }

    if (existingJobSolutions.length >= submissionsRequired) {
      this.logger.log(
        ErrorJob.AllSolutionsHaveAlreadyBeenSent,
        JobService.name,
      );
      throw new ConflictError(ErrorJob.AllSolutionsHaveAlreadyBeenSent);
    }

    const exchangeJobSolutions: ISolution[] =
      await this.storageService.download(
        (webhook.eventData as SolutionEventData)?.solutionsUrl,
      );

    const { errorSolutions, uniqueSolutions } = this.processSolutions(
      exchangeJobSolutions,
      existingJobSolutions,
    );

    const recordingOracleSolutions: ISolution[] = [
      ...uniqueSolutions,
      ...errorSolutions,
    ];

    const jobSolutionUploaded = await this.storageService.uploadJobSolutions(
      webhook.escrowAddress,
      webhook.chainId,
      recordingOracleSolutions,
    );

    await escrowClient.storeResults(
      webhook.escrowAddress,
      jobSolutionUploaded.url,
      jobSolutionUploaded.hash,
    );

    if (
      recordingOracleSolutions.filter((solution) => !solution.error).length >=
      submissionsRequired
    ) {
      let reputationOracleWebhook: string | null = null;
      try {
        const reputationOracleAddress =
          await escrowClient.getReputationOracleAddress(webhook.escrowAddress);
        reputationOracleWebhook = (await KVStoreUtils.get(
          webhook.chainId,
          reputationOracleAddress,
          KVStoreKeys.webhookUrl,
        )) as string;
      } catch (e) {
        //Ignore the error
      }

      if (reputationOracleWebhook) {
        await sendWebhook(
          this.httpService,
          this.logger,
          reputationOracleWebhook,
          {
            chainId: webhook.chainId,
            escrowAddress: webhook.escrowAddress,
            eventType: EventType.JOB_COMPLETED,
          },
          this.web3ConfigService.privateKey,
        );

        return 'The requested job is completed.';
      }
    }

    if (errorSolutions.length) {
      let exchangeOracleURL: string | null = null;
      try {
        exchangeOracleURL = (await KVStoreUtils.get(
          webhook.chainId,
          await escrowClient.getExchangeOracleAddress(webhook.escrowAddress),
          KVStoreKeys.webhookUrl,
        )) as string;
      } catch {
        //Ignore the error
      }

      if (exchangeOracleURL) {
        const eventData: AssignmentRejection[] = errorSolutions.map(
          (solution) => ({
            assigneeId: solution.workerAddress,
            reason: solution.error as SolutionError,
          }),
        );

        const webhookBody: WebhookDto = {
          escrowAddress: webhook.escrowAddress,
          chainId: webhook.chainId,
          eventType: EventType.SUBMISSION_REJECTED,
          eventData: { assignments: eventData },
        };

        await sendWebhook(
          this.httpService,
          this.logger,
          exchangeOracleURL,
          webhookBody,
          this.web3ConfigService.privateKey,
        );
      }
    }

    return 'Solutions recorded.';
  }
}
