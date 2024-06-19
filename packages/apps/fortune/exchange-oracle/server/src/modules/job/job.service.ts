import {
  ChainId,
  Encryption,
  EncryptionUtils,
  EscrowClient,
  StorageClient,
} from '@human-protocol/sdk';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TOKEN } from '../../common/constant';
import {
  AssignmentStatus,
  JobFieldName,
  JobStatus,
  JobType,
} from '../../common/enums/job';
import { EventType } from '../../common/enums/webhook';
import { ISolution } from '../../common/interfaces/job';
import { PageDto } from '../../common/pagination/pagination.dto';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { RejectionEventData, WebhookDto } from '../webhook/webhook.dto';
import { WebhookEntity } from '../webhook/webhook.entity';
import { WebhookRepository } from '../webhook/webhook.repository';
import { GetJobsDto, JobDto, ManifestDto } from './job.dto';
import { JobEntity } from './job.entity';
import { JobRepository } from './job.repository';
import { AssignmentRepository } from '../assignment/assignment.repository';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { ErrorJob, ErrorAssignment } from '../../common/constant/errors';

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
    const jobEntity = await this.jobRepository.findOneByChainIdAndEscrowAddress(
      webhook.chainId,
      webhook.escrowAddress,
    );

    if (jobEntity) {
      this.logger.log(ErrorJob.AlreadyExists, JobService.name);
      throw new BadRequestException(ErrorJob.AlreadyExists);
    }

    const signer = this.web3Service.getSigner(webhook.chainId);
    const escrowClient = await EscrowClient.build(signer);
    const reputationOracleAddress =
      await escrowClient.getReputationOracleAddress(webhook.escrowAddress);

    const newJobEntity = new JobEntity();
    newJobEntity.escrowAddress = webhook.escrowAddress;
    newJobEntity.chainId = webhook.chainId;
    newJobEntity.status = JobStatus.ACTIVE;
    newJobEntity.reputationNetwork = reputationOracleAddress;
    await this.jobRepository.createUnique(newJobEntity);
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

        if (data.fields) {
          if (data.fields.includes(JobFieldName.CreatedAt)) {
            job.createdAt = entity.createdAt.toISOString();
          }
          if (
            data.fields.includes(JobFieldName.JobDescription) ||
            data.fields.includes(JobFieldName.RewardAmount) ||
            data.fields.includes(JobFieldName.RewardToken)
          ) {
            const manifest = await this.getManifest(
              entity.chainId,
              entity.escrowAddress,
            );
            if (data.fields.includes(JobFieldName.JobDescription)) {
              job.jobDescription = manifest.requesterDescription;
            }
            if (data.fields.includes(JobFieldName.RewardAmount)) {
              job.rewardAmount =
                manifest.fundAmount / manifest.submissionsRequired;
            }
            if (data.fields.includes(JobFieldName.RewardToken)) {
              job.rewardToken = TOKEN;
            }
          }
        }

        return job;
      }),
    );
    return new PageDto(data.page!, data.pageSize!, itemCount, jobs);
  }

  public async solveJob(assignmentId: number, solution: string): Promise<void> {
    const assignment =
      await this.assignmentRepository.findOneById(assignmentId);
    if (!assignment) {
      throw new BadRequestException(ErrorAssignment.NotFound);
    }

    if (assignment.status !== AssignmentStatus.ACTIVE) {
      throw new BadRequestException(ErrorAssignment.InvalidStatus);
    }

    await this.addSolution(
      assignment.job.chainId,
      assignment.job.escrowAddress,
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
        } else {
          throw new BadRequestException(
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
      throw new BadRequestException(ErrorJob.SolutionAlreadySubmitted);
    }

    const manifest = await this.getManifest(chainId, escrowAddress);
    if (
      existingJobSolutions.filter((solution) => !solution.error).length >=
      manifest.submissionsRequired
    ) {
      throw new BadRequestException(ErrorJob.JobCompleted);
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
  ): Promise<ManifestDto> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);
    const manifestUrl = await escrowClient.getManifestUrl(escrowAddress);
    const manifestEncrypted =
      await StorageClient.downloadFileFromUrl(manifestUrl);

    let manifest: ManifestDto | null;
    if (
      typeof manifestEncrypted === 'string' &&
      EncryptionUtils.isEncrypted(manifestEncrypted)
    ) {
      try {
        const encryption = await Encryption.build(
          this.pgpConfigService.privateKey,
          this.pgpConfigService.passphrase,
        );

        manifest = JSON.parse(await encryption.decrypt(manifestEncrypted));
      } catch {
        throw new Error(ErrorJob.ManifestDecryptionFailed);
      }
    } else {
      try {
        manifest =
          typeof manifestEncrypted === 'string'
            ? JSON.parse(manifestEncrypted)
            : manifestEncrypted;
      } catch {
        manifest = null;
      }
    }

    if (!manifest) {
      const webhook = new WebhookEntity();
      webhook.escrowAddress = escrowAddress;
      webhook.chainId = chainId;
      webhook.eventType = EventType.TASK_CREATION_FAILED;

      await this.webhookRepository.createUnique(webhook);

      throw new NotFoundException(ErrorJob.ManifestNotFound);
    } else return manifest;
  }
}
