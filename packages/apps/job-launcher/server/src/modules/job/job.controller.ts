import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards';
import { RequestWithUser } from 'src/common/types';
import { JobCancelDto, JobFortuneDto, JobCvatDto } from './job.dto';
import { JobService } from './job.service';
import { JobRequestType } from 'src/common/enums/job';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Job')
@Controller('/job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post('/fortune')
  public async createFortuneJob(
    @Request() req: RequestWithUser,
    @Body() data: JobFortuneDto,
  ): Promise<number> {
    return this.jobService.createJob(req.user.id, JobRequestType.FORTUNE, data);
  }

  @Post('/cvat')
  public async createCvatJob(
    @Request() req: RequestWithUser,
    @Body() data: JobCvatDto,
  ): Promise<number> {
    return this.jobService.createJob(req.user.id, data.type, data);
  }

  @Get('/result')
  public async getResult(
    @Request() req: RequestWithUser,
    @Query('jobId') jobId: number,
  ): Promise<any> {
    return this.jobService.getResult(req.user.id, jobId);
  }

  @Patch('/cancel/:id')
  public async cancelJob(
    @Request() req: RequestWithUser,
    @Param() params: JobCancelDto,
  ): Promise<boolean> {
    return this.jobService.requestToCancelJob(req.user.id, params.id);
  }
}
