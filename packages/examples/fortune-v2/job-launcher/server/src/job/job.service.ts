import { BadGatewayException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";
import { JobMode, JobRequestType, JobStatus } from "../common/decorators";
import { PaymentService } from "../payment/payment.service";
import { IJobCvatCreateDto, IJobFortuneCreateDto, IJobLaunchDto } from "./interfaces";
import { JobEntity } from "./job.entity";
import * as errors from "../common/constants/errors";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    private readonly paymentService: PaymentService,
    @InjectRepository(JobEntity)
    private readonly jobEntityRepository: Repository<JobEntity>,
    private readonly storageService: StorageService,
  ) {}

  public async createFortuneJob(userId: number, dto: IJobFortuneCreateDto): Promise<number> {
    const { chainId, fortunesRequired, requesterDescription, price } = dto;

    // TODO: Implement encryption algorithm https://github.com/humanprotocol/human-protocol/issues/290

    const jobEntity = await this.jobEntityRepository
      .create({
        chainId,
        userId,
        submissionsRequired: fortunesRequired,
        requesterDescription,
        price,
        mode: JobMode.BATCH,
        requestType: JobRequestType.IMAGE_LABEL_BINARY,
        status: JobStatus.PENDING,
      })
      .save();

    if (!jobEntity) {
      this.logger.log(errors.Job.NotCreated, JobService.name);
      throw new NotFoundException(errors.Job.NotCreated);
    }
    
    await jobEntity.save();

    // TODO: Save data to the bucket

    return jobEntity.id;
  }

  public async createCvatJob(userId: number, dto: IJobCvatCreateDto): Promise<number> {
    const { chainId, dataUrl, annotationsPerImage, labels, requesterDescription, requesterAccuracyTarget, price } = dto;

    if (!await this.storageService.isBucketValid(dataUrl)) {
      this.logger.log(errors.Bucket.NotPublic, JobService.name);
      throw new NotFoundException(errors.Bucket.NotPublic);
    }

    // TODO: Implement encryption algorithm https://github.com/humanprotocol/human-protocol/issues/290

    const jobEntity = await this.jobEntityRepository
      .create({
        chainId,
        userId,
        dataUrl,
        submissionsRequired: annotationsPerImage,
        labels,
        requesterDescription,
        requesterAccuracyTarget,
        price,
        mode: JobMode.BATCH,
        requestType: JobRequestType.IMAGE_LABEL_BINARY,
        status: JobStatus.PENDING,
      })
      .save();

    if (!jobEntity) {
      this.logger.log(errors.Job.NotCreated, JobService.name);
      throw new NotFoundException(errors.Job.NotCreated);
    }
    
    await jobEntity.save();

    // TODO: Save data to the bucket

    return jobEntity.id;
  }

  public async confirmPayment(customerId: string, dto: IJobLaunchDto): Promise<boolean> {
    const jobEntity = await this.jobEntityRepository.findOne({ id: dto.jobId });

    if (!jobEntity) {
      this.logger.log(errors.User.NotFound, JobService.name);
      throw new NotFoundException(errors.Job.NotFound);
    }

    this.paymentService.confirmPayment(customerId, dto)

    jobEntity.status = JobStatus.PAID;
    await jobEntity.save();

    return true;
  }

  public async launchJob() {
    // TODO
    //jobEntity.status = JobStatus.LAUNCHED;
  }
}
