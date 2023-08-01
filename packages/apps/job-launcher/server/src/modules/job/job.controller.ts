import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards';
import { JobCvatDto, JobFortuneDto } from './job.dto';
import { JobService } from './job.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Job')
@Controller('/job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post('/fortune')
  public async createFortuneJob(
    @Request() req: any,
    @Body() data: JobFortuneDto,
  ): Promise<number> {
    return this.jobService.createFortuneJob(req.user?.id, data);
  }

  @Post('/cvat')
  public async createCvatJob(
    @Request() req: any,
    @Body() data: JobCvatDto,
  ): Promise<number> {
    return this.jobService.createCvatJob(req.user?.id, data);
  }
}
