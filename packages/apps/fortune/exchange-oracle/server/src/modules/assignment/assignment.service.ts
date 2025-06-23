import { Escrow__factory } from '@human-protocol/core/typechain-types';
import { Injectable } from '@nestjs/common';
import { ServerConfigService } from '../../common/config/server-config.service';
import { ErrorAssignment, ErrorJob } from '../../common/constant/errors';
import { AssignmentStatus, JobStatus, JobType } from '../../common/enums/job';
import {
  ConflictError,
  ServerError,
  ValidationError,
} from '../../common/errors';
import { PageDto } from '../../common/pagination/pagination.dto';
import { JwtUser } from '../../common/types/jwt';
import { JobRepository } from '../job/job.repository';
import { JobService } from '../job/job.service';
import { Web3Service } from '../web3/web3.service';
import {
  AssignmentDto,
  CreateAssignmentDto,
  GetAssignmentsDto,
} from './assignment.dto';
import { AssignmentEntity } from './assignment.entity';
import { AssignmentRepository } from './assignment.repository';
import Logger from '@human-protocol/logger';

@Injectable()
export class AssignmentService {
  private readonly logger = Logger.child({
    context: AssignmentService.name,
  });

  constructor(
    private readonly assignmentRepository: AssignmentRepository,
    private readonly jobRepository: JobRepository,
    private readonly jobService: JobService,
    private readonly web3Service: Web3Service,
    private readonly serverConfigService: ServerConfigService,
  ) {}

  public async createAssignment(
    data: CreateAssignmentDto,
    jwtUser: JwtUser,
  ): Promise<AssignmentEntity> {
    const jobEntity = await this.jobRepository.findOneByChainIdAndEscrowAddress(
      data.chainId,
      data.escrowAddress,
    );

    if (!jobEntity) {
      this.logger.info(ErrorAssignment.JobNotFound);
      throw new ServerError(ErrorAssignment.JobNotFound);
    } else if (jobEntity.status !== JobStatus.ACTIVE) {
      this.logger.info(ErrorJob.InvalidStatus);
      throw new ConflictError(ErrorJob.InvalidStatus);
    } else if (jobEntity.reputationNetwork !== jwtUser.reputationNetwork) {
      this.logger.info(ErrorAssignment.ReputationNetworkMismatch);
      throw new ValidationError(ErrorAssignment.ReputationNetworkMismatch);
    }

    const assignmentEntity =
      await this.assignmentRepository.findOneByJobIdAndWorker(
        jobEntity.id,
        jwtUser.address,
      );

    if (
      assignmentEntity &&
      assignmentEntity.status !== AssignmentStatus.CANCELED
    ) {
      this.logger.info(ErrorAssignment.AlreadyExists);
      throw new ConflictError(ErrorAssignment.AlreadyExists);
    }

    const currentAssignments = await this.assignmentRepository.countByJobId(
      jobEntity.id,
    );

    const manifest = await this.jobService.getManifest(
      data.chainId,
      data.escrowAddress,
      jobEntity.manifestUrl,
    );

    // Check if all required qualifications are present
    const userQualificationsSet = new Set(jwtUser.qualifications);
    const missingQualifications = manifest.qualifications?.filter(
      (qualification) => !userQualificationsSet.has(qualification),
    );
    if (missingQualifications && missingQualifications.length > 0) {
      throw new ValidationError(ErrorAssignment.InvalidAssignmentQualification);
    }

    if (currentAssignments >= manifest.submissionsRequired) {
      this.logger.info(ErrorAssignment.FullyAssigned);
      throw new ValidationError(ErrorAssignment.FullyAssigned);
    }

    const signer = this.web3Service.getSigner(data.chainId);
    const escrow = Escrow__factory.connect(data.escrowAddress, signer);
    const expirationDate = new Date(Number(await escrow.duration()) * 1000);
    if (expirationDate < new Date()) {
      this.logger.info(ErrorAssignment.ExpiredEscrow);
      throw new ValidationError(ErrorAssignment.ExpiredEscrow);
    }

    // Allow reassignation when status is Canceled
    if (assignmentEntity) {
      assignmentEntity.status = AssignmentStatus.ACTIVE;
      return this.assignmentRepository.updateOne(assignmentEntity);
    }

    const newAssignmentEntity = new AssignmentEntity();
    newAssignmentEntity.job = jobEntity;
    newAssignmentEntity.workerAddress = jwtUser.address;
    newAssignmentEntity.status = AssignmentStatus.ACTIVE;
    newAssignmentEntity.rewardAmount =
      manifest.fundAmount / manifest.submissionsRequired;
    newAssignmentEntity.expiresAt = expirationDate;
    return this.assignmentRepository.createUnique(newAssignmentEntity);
  }

  public async getAssignmentList(
    data: GetAssignmentsDto,
    workerAddress: string,
    reputationNetwork: string,
  ): Promise<PageDto<AssignmentDto>> {
    if (data.jobType && data.jobType !== JobType.FORTUNE)
      return new PageDto(data.page!, data.pageSize!, 0, []);

    const { entities, itemCount } =
      await this.assignmentRepository.fetchFiltered({
        ...data,
        reputationNetwork,
        workerAddress,
        skip: data.skip!,
        pageSize: data.pageSize ?? 10,
      });
    const assignments = await Promise.all(
      entities.map(async (entity) => {
        const assignment = new AssignmentDto(
          entity.id.toString(),
          entity.job.escrowAddress,
          entity.job.chainId,
          JobType.FORTUNE,
          entity.status,
          entity.rewardAmount,
          entity.job.rewardToken,
          entity.createdAt.toISOString(),
          entity.expiresAt.toISOString(),
          entity.updatedAt.toISOString(),
        );
        if (entity.status === AssignmentStatus.ACTIVE)
          assignment.url =
            this.serverConfigService.feURL +
            '/assignment/' +
            entity.id.toString();
        return assignment;
      }),
    );
    return new PageDto(data.page!, data.pageSize!, itemCount, assignments);
  }

  async resign(assignmentId: number, workerAddress: string): Promise<void> {
    const assignment =
      await this.assignmentRepository.findOneById(assignmentId);

    if (!assignment) {
      throw new ServerError(ErrorAssignment.NotFound);
    }
    if (assignment.workerAddress !== workerAddress) {
      throw new ConflictError(ErrorAssignment.InvalidAssignment);
    }

    if (assignment.status !== AssignmentStatus.ACTIVE) {
      throw new ConflictError(ErrorAssignment.InvalidStatus);
    }

    assignment.status = AssignmentStatus.CANCELED;
    await this.assignmentRepository.updateOne(assignment);
  }
}
