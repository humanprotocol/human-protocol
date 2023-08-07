import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards';
import { JobCvatDto, JobFortuneDto } from './job.dto';
import { JobService } from './job.service';

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
  ): Promise<number> {
    return this.jobService.createFortuneJob(req.user?.id, data);
  }

  @UseGuards(RolesGuard)
  @Post('/cvat')
  public async createCvatJob(
    @Request() req: any,
    @Body() data: JobCvatDto,
  ): Promise<number> {
    return this.jobService.createCvatJob(req.user?.id, data);
  }

  @UseGuards(RolesGuard)
  @Get('/result')
  public async getResult(@Request() req: any): Promise<any> {
    return this.jobService.getResult(req.user?.id);
  }
}
