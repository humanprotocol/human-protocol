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
import { ErrorAssignment } from 'src/common/constant/errors';

@Injectable()
export class AssignmentService {
  public readonly logger = new Logger(AssignmentService.name);

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
    try {
      console.log(9999)
    const jobEntity = await this.jobRepository.findOneByChainIdAndEscrowAddress(
      data.chainId,
      data.escrowAddress,
    );

    jwtUser = {
      email: 'eugene-test@hmt.ai',
      address: '0x0755D4d722a4a201c1C5A4B5E614D913e7747b36',
      kycStatus: 'APPROVED',
      reputationNetwork: '0x6b4A1439F30E55ffcF9619a2ac5Fc3Bec571D4cb'
    }
    console.log(111111)
    if (!jobEntity) {
      this.logger.log(ErrorAssignment.JobNotFound, AssignmentService.name);
      throw new BadRequestException(ErrorAssignment.JobNotFound);
    } else if (jobEntity.reputationNetwork !== jwtUser.reputationNetwork) {
      this.logger.log(
        ErrorAssignment.ReputationNetworkMismatch,
        AssignmentService.name,
      );
      throw new BadRequestException(
        ErrorAssignment.ReputationNetworkMismatch,
      );
    }
    console.log(222222)
    const assignmentEntity =
      await this.assignmentRepository.findOneByJobIdAndWorker(
        jobEntity.id,
        jwtUser.address,
      );

    if (assignmentEntity) {
      this.logger.log(ErrorAssignment.AlreadyExists, AssignmentService.name);
      throw new BadRequestException(ErrorAssignment.AlreadyExists);
    }
    console.log(333333)
    const currentAssignments = await this.assignmentRepository.countByJobId(
      jobEntity.id,
    );
    console.log(444444)
    const manifest = await this.jobService.getManifest(
      data.chainId,
      data.escrowAddress,
    );
    console.log(555555)
    if (currentAssignments >= manifest.submissionsRequired) {
      this.logger.log(ErrorAssignment.FullyAssigned, AssignmentService.name);
      throw new BadRequestException(ErrorAssignment.FullyAssigned);
    }

    const signer = this.web3Service.getSigner(data.chainId);
    const escrow = Escrow__factory.connect(data.escrowAddress, signer);
    const expirationDate = new Date(Number(await escrow.duration()) * 1000);
    if (expirationDate < new Date()) {
      this.logger.log(ErrorAssignment.ExpiredEscrow, AssignmentService.name);
      throw new BadRequestException(ErrorAssignment.ExpiredEscrow);
    }
    console.log(jobEntity)
    const newAssignmentEntity = new AssignmentEntity();
    newAssignmentEntity.job = jobEntity;
    newAssignmentEntity.workerAddress = jwtUser.address;
    newAssignmentEntity.status = AssignmentStatus.ACTIVE;
    newAssignmentEntity.expiresAt = expirationDate;
    await this.assignmentRepository.createUnique(newAssignmentEntity);
    } catch (e) {
      console.log(0, e)
    }
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
        pageSize: data.pageSize!,
        skip: data.skip!,
        reputationNetwork,
        workerAddress,
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