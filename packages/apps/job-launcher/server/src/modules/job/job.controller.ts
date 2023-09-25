import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, SignatureAuthGuard } from '../../common/guards';
import { RequestWithUser } from '../../common/types';
import {
  JobFortuneDto,
  JobCvatDto,
  JobListDto,
  JobCancelDto,
  EscrowFailedWebhookDto,
  JobDetailsDto,
  JobIdDto,
} from './job.dto';
import { JobService } from './job.service';
import { JobRequestType, JobStatusFilter } from '../../common/enums/job';
import { Public } from '../../common/decorators';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';

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

  @Get('/list')
  @ApiQuery({ name: 'status', required: false, enum: JobStatusFilter })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'limit', required: false })
  public async getJobList(
    @Request() req: RequestWithUser,
    @Query('status') status: JobStatusFilter,
    @Query('skip', new DefaultValuePipe(null)) skip?: number,
    @Query('limit', new DefaultValuePipe(null)) limit?: number,
  ): Promise<JobListDto[]> {
    return this.jobService.getJobsByStatus(req.user.id, status, skip, limit);
  }

  @Get('/result')
  public async getResult(
    @Request() req: RequestWithUser,
    @Query('jobId') jobId: number,
  ): Promise<any> {
    return this.jobService.getResult(req.user.id, jobId);
  }

  @Public()
  @Get('/cron/launch')
  public async launchCronJob(): Promise<any> {
    return this.jobService.launchCronJob();
  }

  @Patch('/cancel/:id')
  public async cancelJob(
    @Request() req: RequestWithUser,
    @Param() params: JobCancelDto,
  ): Promise<boolean> {
    return this.jobService.requestToCancelJob(req.user.id, params.id);
  }

  @Public()
  @Get('/cron/cancel')
  public async cancelCronJob(): Promise<any> {
    return this.jobService.cancelCronJob();
  }

  @Public()
  @UseGuards(SignatureAuthGuard)
  @Post('/escrow-failed-webhook')
  public async (
    @Headers(HEADER_SIGNATURE_KEY) _: string,
    @Body() data: EscrowFailedWebhookDto,
  ): Promise<any> {
    return this.jobService.escrowFailedWebhook(data);
  }

  @Get('/details/:id')
  public async getDetails(
    @Request() req: RequestWithUser,
    @Param() params: JobIdDto,
  ): Promise<JobDetailsDto> {
    return this.jobService.getDetails(req.user.id, params.id);
  }
}
