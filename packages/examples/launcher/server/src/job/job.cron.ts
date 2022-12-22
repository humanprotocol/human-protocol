import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import Web3 from "web3";
import { JobStatus } from "../common/decorators";
import { JobService } from "./job.service";


@Injectable()
export class JobCron {
  private web3: Web3;
  private readonly logger = new Logger(JobCron.name);

  constructor(
    private readonly jobService: JobService,
  ) {
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  public async setupEscrow() {
    try {
      const jobEntites = await this.jobService.getJobByStatus(JobStatus.PAID);
    
      // TODO: Add queue
      // TODO: Track rejects 
      const jobEntity = jobEntites[jobEntites.length - 1];
      await this.jobService.setupEscrow(jobEntity)
    } catch(e) {
      return;
    }
  }
}