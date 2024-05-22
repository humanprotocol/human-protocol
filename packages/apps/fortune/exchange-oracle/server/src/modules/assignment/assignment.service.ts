import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AssignmentStatus, JobType } from '../../common/enums/job';
import { JwtUser } from '../../common/types/jwt';
import { JobRepository } from '../job/job.repository';
import {
  AssignmentDto,
  CreateAssignmentDto,
  GetAssignmentsDto,
} from './assignment.dto';
import { AssignmentEntity } from './assignment.entity';
import { AssignmentRepository } from './assignment.repository';
import { PageDto } from '../../common/pagination/pagination.dto';
import { TOKEN } from '../../common/constant';
import { JobService } from '../job/job.service';
import { Escrow__factory } from '@human-protocol/core/typechain-types';
import { Web3Service } from '../web3/web3.service';

@Injectable()
export class AssignmentService {
  public readonly logger = new Logger(AssignmentService.name);
  private storage: {
    [key: string]: string[];
  } = {};

  constructor(
    public readonly assignmentRepository: AssignmentRepository,
    public readonly jobRepository: JobRepository,
    public readonly jobService: JobService,
    public readonly web3Service: Web3Service,
  ) {}

  public async createAssignment(
    data: CreateAssignmentDto,
    jwtUser: JwtUser,
  ): Promise<void> {
    const jobEntity = await this.jobRepository.findOneByChainIdAndEscrowAddress(
      data.chainId,
      data.escrowAddress,
    );

    if (!jobEntity) {
      this.logger.log('Job not found', AssignmentService.name);
      throw new BadRequestException('Job not found');
    } else if (jobEntity.reputationNetwork !== jwtUser.reputationNetwork) {
      this.logger.log(
        'Requested job is not in your reputation network',
        AssignmentService.name,
      );
      throw new BadRequestException(
        'Requested job is not in your reputation network',
      );
    }
    const assignmentEntity =
      await this.assignmentRepository.findOneByJobIdAndWorker(
        jobEntity.id,
        jwtUser.address,
      );

    if (assignmentEntity) {
      this.logger.log('Assignment already exists', AssignmentService.name);
      throw new BadRequestException('Assignment already exists');
    }

    const currentAssignments = await this.assignmentRepository.countByJobId(
      jobEntity.id,
    );
    const manifest = await this.jobService.getManifest(
      data.chainId,
      data.escrowAddress,
    );

    if (currentAssignments >= manifest.submissionsRequired) {
      this.logger.log('Fully assigned job', AssignmentService.name);
      throw new BadRequestException('Fully assigned job');
    }

    const signer = this.web3Service.getSigner(data.chainId);
    const escrow = Escrow__factory.connect(data.escrowAddress, signer);
    const expirationDate = new Date(Number(await escrow.duration()) * 1000);
    if (expirationDate < new Date()) {
      this.logger.log('Expired escrow', AssignmentService.name);
      throw new BadRequestException('Expired escrow');
    }

    const newAssignmentEntity = new AssignmentEntity();
    newAssignmentEntity.job = jobEntity;
    newAssignmentEntity.workerAddress = jwtUser.address;
    newAssignmentEntity.status = AssignmentStatus.ACTIVE;
    newAssignmentEntity.expiresAt = expirationDate;
    await this.assignmentRepository.createUnique(newAssignmentEntity);
  }

  public async getAssignmentList(
    data: GetAssignmentsDto,
    workerAddress: string,
    reputationNetwork: string,
    requestUrl: string,
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
        const manifest = await this.jobService.getManifest(
          entity.job.chainId,
          entity.job.escrowAddress,
        );
        const assignment = new AssignmentDto(
          entity.id,
          entity.job.escrowAddress,
          entity.job.chainId,
          JobType.FORTUNE,
          entity.status,
          manifest.fundAmount / manifest.submissionsRequired,
          TOKEN,
          entity.createdAt.toISOString(),
          entity.expiresAt.toISOString(),
        );

        if (entity.status === AssignmentStatus.ACTIVE)
          assignment.url = requestUrl;
        else assignment.updatedAt = entity.updatedAt.toISOString();

        return assignment;
      }),
    );
    return new PageDto(data.page!, data.pageSize!, itemCount, assignments);
  }
}
