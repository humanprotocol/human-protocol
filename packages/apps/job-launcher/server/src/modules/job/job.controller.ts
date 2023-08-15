import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards';
import { RequestWithUser } from 'src/common/types';
import { CreateJobDto, JobCvatDto, JobFortuneDto } from './job.dto';
import { JobService } from './job.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Job')
@Controller('/job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post('/fortune')
  public async createFortuneJob(
    @Request() req: RequestWithUser,
    @Body() data: CreateJobDto,
  ): Promise<number> {
    return this.jobService.createJob(req.user.id, data);
  }
  
  @Get('/result')
  public async getResult(@Request() req: any): Promise<any> {
    return this.jobService.getResult(req.user?.id);
  }
}
