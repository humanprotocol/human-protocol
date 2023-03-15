import { Controller } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JobService } from "./job.service";

@ApiBearerAuth()
@ApiTags("Job")
@Controller("/job")
export class JobController {
  constructor(private readonly jobService: JobService) {}
}
