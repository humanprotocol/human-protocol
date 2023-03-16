import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";
import { JobStatus } from "../common/decorators";
import { PaymentService } from "../payment/payment.service";
import { IJobCvatCreateDto, IJobFortuneCreateDto, IJobLaunchDto } from "./interfaces";
import { JobEntity } from "./job.entity";
import * as errors from "../common/constants/errors";

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    private readonly jobService: JobService,
    private readonly paymentService: PaymentService,
    @InjectRepository(JobEntity)
    private readonly jobEntityRepository: Repository<JobEntity>,
  ) {}

  public createFortuneJob(userId: number, dto: IJobFortuneCreateDto) {
    // TODO: Save data to database
  } 

  public createCvatJob(userId: number, dto: IJobCvatCreateDto) {
    // TODO: Save data to database
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
