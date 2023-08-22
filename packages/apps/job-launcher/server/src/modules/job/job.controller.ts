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
import { JobCancelDto, JobFortuneDto, JobImageLabelBinaryDto } from './job.dto';
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
    @Body() data: JobImageLabelBinaryDto,
  ): Promise<number> {
    return this.jobService.createJob(req.user.id, JobRequestType.IMAGE_LABEL_BINARY, data);
  }

  @Get('/result')
  public async getResult(@Request() req: any): Promise<any> {
    return this.jobService.getResult(req.user?.id);
  }

  @Post('/cancel')
  public async cancelJob(
    @Request() req: RequestWithUser,
    @Body() data: JobCancelDto,
  ): Promise<number> {
    return this.jobService.cancelJob(req.user.id, JobRequestType.FORTUNE, data);
  }
}
