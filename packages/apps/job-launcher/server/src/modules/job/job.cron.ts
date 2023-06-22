import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { SortDirection } from '../../common/enums/collection';
import { JOB_RETRIES_COUNT_THRESHOLD } from '../../common/constants';
import { JobStatus } from '../../common/enums/job';
import { PaymentService } from '../payment/payment.service';
import { JobEntity } from './job.entity';
import { JobService } from './job.service';

@Injectable()
export class JobCron {
  private readonly logger = new Logger(JobCron.name);

  constructor(
    private readonly jobService: JobService,
    private readonly paymentService: PaymentService,
    @InjectRepository(JobEntity)
    private readonly jobEntityRepository: Repository<JobEntity>,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  public async launchJob() {
    try {
      // TODO: Add retry policy and process failure requests https://github.com/humanprotocol/human-protocol/issues/334
      const jobEntity = await this.jobEntityRepository.findOne({
        where: {
          status: JobStatus.PAID,
          retriesCount: LessThanOrEqual(JOB_RETRIES_COUNT_THRESHOLD),
          waitUntil: LessThanOrEqual(new Date()),
        },
        order: {
          waitUntil: SortDirection.ASC,
        },
      });

      if (!jobEntity) return;

      await this.jobService.launchJob(jobEntity);
    } catch (e) {
      return;
    }
  }
}
