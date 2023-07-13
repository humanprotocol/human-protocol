import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards';
import { JobCvatDto, JobFortuneDto } from './job.dto';
import { JobService } from './job.service';
import { IId } from 'src/common/interfaces';

@ApiBearerAuth()
@ApiTags('Job')
@Controller('/job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @UseGuards(RolesGuard)
  @Post('/fortune')
  public async createFortuneJob(
    @Request() req: any,
    @Body() data: JobFortuneDto,
  ): Promise<IId> {
    return this.jobService.createFortuneJob(req.user?.id, data);
  }

  @UseGuards(RolesGuard)
  @Post('/cvat')
  public async createCvatJob(
    @Request() req: any,
    @Body() data: JobCvatDto,
  ): Promise<IId> {
    return this.jobService.createCvatJob(req.user?.id, data);
  }
}
