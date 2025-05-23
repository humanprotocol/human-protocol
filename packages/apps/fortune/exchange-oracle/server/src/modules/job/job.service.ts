import {
  HMToken,
  HMToken__factory,
} from '@human-protocol/core/typechain-types';
import {
  ChainId,
  Encryption,
  EncryptionUtils,
  EscrowClient,
  StorageClient,
} from '@human-protocol/sdk';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { ErrorAssignment, ErrorJob } from '../../common/constant/errors';
import { SortDirection } from '../../common/enums/collection';
import {
  AssignmentStatus,
  JobFieldName,
  JobSortField,
  JobStatus,
  JobType,
} from '../../common/enums/job';
import { EventType } from '../../common/enums/webhook';
import {
  ConflictError,
  NotFoundError,
  ServerError,
  ValidationError,
} from '../../common/errors';
import { ISolution } from '../../common/interfaces/job';
import { PageDto } from '../../common/pagination/pagination.dto';
import { AssignmentEntity } from '../assignment/assignment.entity';
import { AssignmentRepository } from '../assignment/assignment.repository';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { RejectionEventData, WebhookDto } from '../webhook/webhook.dto';
import { WebhookEntity } from '../webhook/webhook.entity';
import { WebhookRepository } from '../webhook/webhook.repository';
import { GetJobsDto, JobDto, ManifestDto } from './job.dto';
import { JobEntity } from './job.entity';
import { JobRepository } from './job.repository';

@Injectable()
export class JobService {
  public readonly logger = new Logger(JobService.name);

  constructor(
    private readonly pgpConfigService: PGPConfigService,
    public readonly jobRepository: JobRepository,
    public readonly assignmentRepository: AssignmentRepository,
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    @Inject(StorageService)
    private readonly storageService: StorageService,
    public readonly webhookRepository: WebhookRepository,
  ) {}

  public async createJob(webhook: WebhookDto): Promise<void> {
    const { chainId, escrowAddress } = webhook;
    const jobEntity = await this.jobRepository.findOneByChainIdAndEscrowAddress(
      chainId,
      escrowAddress,
    );

    if (jobEntity) {
      this.logger.log(ErrorJob.AlreadyExists, JobService.name);
      throw new ConflictError(ErrorJob.AlreadyExists);
    }

    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);
    const reputationOracleAddress =
      await escrowClient.getReputationOracleAddress(escrowAddress);

    const tokenAddress = await escrowClient.getTokenAddress(escrowAddress);
    const tokenContract: HMToken = HMToken__factory.connect(
      tokenAddress,
      signer,
    );

    const newJobEntity = new JobEntity();
    newJobEntity.escrowAddress = escrowAddress;
    newJobEntity.manifestUrl = await escrowClient.getManifestUrl(escrowAddress);
    newJobEntity.chainId = chainId;
    newJobEntity.rewardToken = await tokenContract.symbol();
    newJobEntity.status = JobStatus.ACTIVE;
    newJobEntity.reputationNetwork = reputationOracleAddress;
    await this.jobRepository.createUnique(newJobEntity);
  }

  public async completeJob(webhook: WebhookDto): Promise<void> {
    const { chainId, escrowAddress } = webhook;

    const jobEntity =
      await this.jobRepository.findOneByChainIdAndEscrowAddressWithAssignments(
        chainId,
        escrowAddress,
      );

    if (!jobEntity) {
      throw new ServerError(ErrorJob.NotFound);
    }

    if (jobEntity.status === JobStatus.COMPLETED) {
      throw new ConflictError(ErrorJob.AlreadyCompleted);
    }

    jobEntity.status = JobStatus.COMPLETED;
    jobEntity.assignments.forEach((assignment: AssignmentEntity) => {
      assignment.status = AssignmentStatus.COMPLETED;
    });

    await this.jobRepository.save(jobEntity);
  }

  public async cancelJob(webhook: WebhookDto): Promise<void> {
    const { chainId, escrowAddress } = webhook;

    const jobEntity =
      await this.jobRepository.findOneByChainIdAndEscrowAddressWithAssignments(
        chainId,
        escrowAddress,
      );

    if (!jobEntity) {
      throw new ServerError(ErrorJob.NotFound);
    }

    if (jobEntity.status === JobStatus.CANCELED) {
      throw new ConflictError(ErrorJob.AlreadyCanceled);
    }

    jobEntity.status = JobStatus.CANCELED;
    jobEntity.assignments.forEach((assignment: AssignmentEntity) => {
      assignment.status = AssignmentStatus.CANCELED;
    });

    await this.jobRepository.save(jobEntity);
  }

  public async getJobList(
    data: GetJobsDto,
    reputationNetwork: string,
  ): Promise<PageDto<JobDto>> {
    if (data.jobType && data.jobType !== JobType.FORTUNE)
      return new PageDto(data.page!, data.pageSize!, 0, []);

    const { entities, itemCount } = await this.jobRepository.fetchFiltered({
      ...data,
      pageSize: data.pageSize!,
      skip: data.skip!,
      reputationNetwork,
    });
    const jobs = await Promise.all(
      entities.map(async (entity) => {
        const job = new JobDto(
          entity.escrowAddress,
          entity.chainId,
          JobType.FORTUNE,
          entity.status,
        );

        if (data.fields?.includes(JobFieldName.CreatedAt)) {
          job.createdAt = entity.createdAt.toISOString();
        }
        if (data.fields?.includes(JobFieldName.UpdatedAt)) {
          job.updatedAt = entity.updatedAt.toISOString();
        }
        if (
          data.fields?.includes(JobFieldName.JobDescription) ||
          data.fields?.includes(JobFieldName.RewardAmount) ||
          data.fields?.includes(JobFieldName.RewardToken) ||
          data.fields?.includes(JobFieldName.Qualifications) ||
          data.sortField === JobSortField.REWARD_AMOUNT
        ) {
          const manifest = await this.getManifest(
            entity.chainId,
            entity.escrowAddress,
            entity.manifestUrl,
          );
          if (data.fields?.includes(JobFieldName.JobDescription)) {
            job.jobDescription = manifest.requesterDescription;
          }
          if (
            data.fields?.includes(JobFieldName.RewardAmount) ||
            data.sortField === JobSortField.REWARD_AMOUNT
          ) {
            job.rewardAmount = (
              manifest.fundAmount / manifest.submissionsRequired
            ).toString();
          }
          if (data.fields?.includes(JobFieldName.RewardToken)) {
            job.rewardToken = entity.rewardToken;
          }
          if (data.fields?.includes(JobFieldName.Qualifications)) {
            job.qualifications = manifest.qualifications;
          }
        }

        return job;
      }),
    );

    if (data.sortField === JobSortField.REWARD_AMOUNT) {
      jobs.sort((a, b) => {
        const rewardA = Number(a.rewardAmount ?? 0);
        const rewardB = Number(b.rewardAmount ?? 0);
        if (data.sort === SortDirection.DESC) {
          return rewardB - rewardA;
        } else {
          return rewardA - rewardB;
        }
      });
    }

    return new PageDto(data.page!, data.pageSize!, itemCount, jobs);
  }

  public async solveJob(assignmentId: number, solution: string): Promise<void> {
    const assignment =
      await this.assignmentRepository.findOneById(assignmentId);
    if (!assignment) {
      throw new ServerError(ErrorAssignment.NotFound);
    }

    if (assignment.status !== AssignmentStatus.ACTIVE) {
      throw new ConflictError(ErrorAssignment.InvalidStatus);
    } else if (assignment.job.status !== JobStatus.ACTIVE) {
      throw new ConflictError(ErrorJob.InvalidStatus);
    }

    await this.addSolution(
      assignment.job.chainId,
      assignment.job.escrowAddress,
      assignment.job.manifestUrl,
      assignment.workerAddress,
      solution,
    );

    assignment.status = AssignmentStatus.VALIDATION;
    await this.assignmentRepository.updateOne(assignment);

    const webhook = new WebhookEntity();
    webhook.escrowAddress = assignment.job.escrowAddress;
    webhook.chainId = assignment.job.chainId;
    webhook.eventType = EventType.SUBMISSION_IN_REVIEW;

    await this.webhookRepository.createUnique(webhook);
  }

  public async processInvalidJobSolution(
    invalidJobSolution: WebhookDto,
  ): Promise<void> {
    if (invalidJobSolution.eventData) {
      const existingJobSolutions =
        await this.storageService.downloadJobSolutions(
          invalidJobSolution.escrowAddress,
          invalidJobSolution.chainId,
        );
      for (const invalidSolution of (
        invalidJobSolution.eventData as RejectionEventData
      )?.assignments) {
        const foundSolution = existingJobSolutions.find(
          (sol) => sol.workerAddress === invalidSolution.assigneeId,
        );

        if (foundSolution) {
          foundSolution.error = true;
          const assignment =
            await this.assignmentRepository.findOneByEscrowAndWorker(
              invalidJobSolution.escrowAddress,
              invalidJobSolution.chainId,
              foundSolution.workerAddress,
            );
          if (assignment) {
            assignment.status = AssignmentStatus.REJECTED;
            this.assignmentRepository.updateOne(assignment);
          }
        } else {
          throw new ServerError(
            `Solution not found in Escrow: ${invalidJobSolution.escrowAddress}`,
          );
        }
      }

      await this.storageService.uploadJobSolutions(
        invalidJobSolution.escrowAddress,
        invalidJobSolution.chainId,
        existingJobSolutions,
      );
    }
  }

  private async addSolution(
    chainId: ChainId,
    escrowAddress: string,
    manifestUrl: string,
    workerAddress: string,
    solution: string,
  ): Promise<string> {
    const existingJobSolutions = await this.storageService.downloadJobSolutions(
      escrowAddress,
      chainId,
    );

    if (
      existingJobSolutions.find(
        (solution) => solution.workerAddress === workerAddress,
      )
    ) {
      throw new ValidationError(ErrorJob.SolutionAlreadySubmitted);
    }

    const manifest = await this.getManifest(
      chainId,
      escrowAddress,
      manifestUrl,
    );
    if (
      existingJobSolutions.filter((solution) => !solution.error).length >=
      manifest.submissionsRequired
    ) {
      throw new ConflictError(ErrorJob.JobCompleted);
    }

    const newJobSolutions: ISolution[] = [
      ...existingJobSolutions,
      {
        workerAddress: workerAddress,
        solution: solution,
      },
    ];

    const url = await this.storageService.uploadJobSolutions(
      escrowAddress,
      chainId,
      newJobSolutions,
    );

    return url;
  }

  public async getManifest(
    chainId: number,
    escrowAddress: string,
    manifestUrl: string,
  ): Promise<ManifestDto> {
    let manifest: ManifestDto | null = null;

    try {
      const manifestEncrypted =
        await StorageClient.downloadFileFromUrl(manifestUrl);

      if (
        typeof manifestEncrypted === 'string' &&
        EncryptionUtils.isEncrypted(manifestEncrypted)
      ) {
        const encryption = await Encryption.build(
          this.pgpConfigService.privateKey!,
          this.pgpConfigService.passphrase,
        );
        const decryptedData = await encryption.decrypt(manifestEncrypted);
        manifest = JSON.parse(Buffer.from(decryptedData).toString());
      } else {
        manifest =
          typeof manifestEncrypted === 'string'
            ? JSON.parse(manifestEncrypted)
            : manifestEncrypted;
      }
    } catch {
      manifest = null;
    }

    if (!manifest) {
      const webhook = new WebhookEntity();
      webhook.escrowAddress = escrowAddress;
      webhook.chainId = chainId;
      webhook.eventType = EventType.ESCROW_FAILED;
      webhook.failureDetail = ErrorJob.ManifestNotFound;

      await this.webhookRepository.createUnique(webhook);
      throw new NotFoundError(ErrorJob.ManifestNotFound);
    }

    return manifest;
  }

  public async pauseJob(webhook: WebhookDto): Promise<void> {
    const jobEntity = await this.jobRepository.findOneByChainIdAndEscrowAddress(
      webhook.chainId,
      webhook.escrowAddress,
    );
    if (!jobEntity) {
      throw new ServerError(ErrorJob.NotFound);
    }
    if (jobEntity.status !== JobStatus.ACTIVE) {
      throw new ConflictError(ErrorJob.InvalidStatus);
    }
    jobEntity.status = JobStatus.PAUSED;
    await this.jobRepository.updateOne(jobEntity);
  }

  public async resumeJob(webhook: WebhookDto): Promise<void> {
    const jobEntity = await this.jobRepository.findOneByChainIdAndEscrowAddress(
      webhook.chainId,
      webhook.escrowAddress,
    );
    if (!jobEntity) {
      throw new ServerError(ErrorJob.NotFound);
    }
    if (jobEntity.status !== JobStatus.PAUSED) {
      throw new ConflictError(ErrorJob.InvalidStatus);
    }
    jobEntity.status = JobStatus.ACTIVE;
    await this.jobRepository.updateOne(jobEntity);
  }
}
