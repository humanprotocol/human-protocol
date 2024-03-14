import {
  EscrowClient,
  EscrowStatus,
  KVStoreClient,
  KVStoreKeys,
} from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ethers } from 'ethers';
import * as Minio from 'minio';

import { Web3ConfigType, web3ConfigKey } from '../../common/config';
import { ErrorJob } from '../../common/constants/errors';
import { JobRequestType, SolutionError } from '../../common/enums/job';
import { IManifest, ISolution } from '../../common/interfaces/job';
import { checkCurseWords } from '../../common/utils/curseWords';
import { sendWebhook } from '../../common/utils/webhook';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { EventType } from '../../common/enums/webhook';
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
    @Inject(web3ConfigKey)
    private web3Config: Web3ConfigType,
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

      const duplicatedInRecording = recordingSolutions.filter(
        (solution) =>
          solution.workerAddress === exchangeSolution.workerAddress ||
          solution.solution === exchangeSolution.solution,
      );

      if (duplicatedInRecording.length === 0) {
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
              errorSolutions.push({
                ...duplicated,
                error: SolutionError.Duplicated,
              });
            }
          });
        }
        if (checkCurseWords(exchangeSolution.solution))
          errorSolutions.push({
            ...exchangeSolution,
            error: SolutionError.CurseWord,
          });
        else uniqueSolutions.push(exchangeSolution);
      }
    });
    return { errorSolutions, uniqueSolutions };
  }

  async processJobSolution(webhook: WebhookDto): Promise<string> {
    const signer = this.web3Service.getSigner(webhook.chainId);
    const escrowClient = await EscrowClient.build(signer);
    const kvstoreClient = await KVStoreClient.build(signer);

    const recordingOracleAddress = await escrowClient.getRecordingOracleAddress(
      webhook.escrowAddress,
    );
    if (
      ethers.getAddress(recordingOracleAddress) !== (await signer.getAddress())
    ) {
      this.logger.log(ErrorJob.AddressMismatches, JobService.name);
      throw new BadRequestException(ErrorJob.AddressMismatches);
    }

    const escrowStatus = await escrowClient.getStatus(webhook.escrowAddress);
    if (
      escrowStatus !== EscrowStatus.Pending &&
      escrowStatus !== EscrowStatus.Partial
    ) {
      this.logger.log(ErrorJob.InvalidStatus, JobService.name);
      throw new BadRequestException(ErrorJob.InvalidStatus);
    }

    const manifestUrl = await escrowClient.getManifestUrl(
      webhook.escrowAddress,
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
      throw new BadRequestException(ErrorJob.AllSolutionsHaveAlreadyBeenSent);
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
      ...existingJobSolutions,
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

    const reputationOracleAddress =
      await escrowClient.getReputationOracleAddress(webhook.escrowAddress);
    const reputationOracleWebhook = (await kvstoreClient.get(
      reputationOracleAddress,
      KVStoreKeys.webhookUrl,
    )) as string;

    if (
      recordingOracleSolutions.filter((solution) => !solution.error).length >=
      submissionsRequired
    ) {
      await sendWebhook(
        this.httpService,
        this.logger,
        reputationOracleWebhook,
        {
          chainId: webhook.chainId,
          escrowAddress: webhook.escrowAddress,
          eventType: EventType.ESCROW_RECORDED,
        },
        this.web3Config.web3PrivateKey,
      );

      return 'The requested job is completed.';
    }
    if (errorSolutions.length) {
      const exchangeOracleURL = (await kvstoreClient.get(
        await escrowClient.getExchangeOracleAddress(webhook.escrowAddress),
        KVStoreKeys.webhookUrl,
      )) as string;

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
        this.web3Config.web3PrivateKey,
      );
    }

    return 'Solutions recorded.';
  }
}
