import { Body, Controller, Post, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RolesGuard } from "../common/guards";
import { JobCvatCreateDto, JobFortuneCreateDto, JobLaunchDto } from "./dto";
import { JobService } from "./job.service";

@ApiBearerAuth()
@ApiTags("Job")
@Controller("/job")
export class JobController {
  constructor(
    private readonly jobService: JobService
  ) {}

  @UseGuards(RolesGuard)
  @Post("/fortune")
  public async createFortuneJob(@Request() req: any, @Body() data: JobFortuneCreateDto): Promise<any> {
    return this.jobService.createFortuneJob(req.user?.id, data);
  }

  @UseGuards(RolesGuard)
  @Post("/cvat")
  public async createCvatJob(@Request() req: any, @Body() data: JobCvatCreateDto): Promise<any> {
    return this.jobService.createCvatJob(req.user?.id, data);
  }

  @UseGuards(RolesGuard)
  @Post("/confirm-payment")
  public async confirmPayment(@Request() req: any, @Body() data: JobLaunchDto): Promise<any> {
    return this.jobService.confirmPayment(req.user?.stripeCustomerId, data);
  }
}