import { Injectable, Logger } from "@nestjs/common";
import { JobService } from "./job.service";


@Injectable()
export class JobCron {
  private readonly logger = new Logger(JobCron.name);

  constructor(
    private readonly jobService: JobService,
  ) {}
}