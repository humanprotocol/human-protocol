import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SortDirection } from "../common/collection";
import { JobStatus } from "../common/decorators";
import { JobEntity } from "./job.entity";
import { JobService } from "./job.service";


@Injectable()
export class JobCron {
  private readonly logger = new Logger(JobCron.name);

  constructor(
    private readonly jobService: JobService,
    @InjectRepository(JobEntity)
    private readonly jobEntityRepository: Repository<JobEntity>,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  public async setupEscrow() {
    try {
      // TODO: Add retry policy and process failure requests https://github.com/humanprotocol/human-protocol/issues/334
      // Use wait_until param
      const jobEntity = await this.jobEntityRepository.findOne({
        where: {
          status: JobStatus.PAID
        },
        order: {
          createdAt: SortDirection.ASC,
        },
      });
  
      if (!jobEntity) return;
  
      await this.jobService.launchJob(jobEntity)
    } catch(e) {
      return;
    }
  }
}