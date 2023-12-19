import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
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
  FortuneFinalResultDto,
  JobCaptchaDto,
  FortuneFinalResultDto,
} from './job.dto';
import { JobService } from './job.service';
import { JobRequestType, JobStatusFilter } from '../../common/enums/job';
import { Public, ApiKey } from '../../common/decorators';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { ChainId } from '@human-protocol/sdk';
import { Role } from '../../common/enums/role';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Job')
@Controller('/job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @ApiOperation({
    summary: 'Create a fortune job',
    description: 'Endpoint to create a new fortune job.',
  })
  @ApiBody({ type: JobFortuneDto })
  @ApiResponse({
    status: 200,
    description: 'ID of the created fortune job.',
    type: Number,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @Post('/fortune')
  @ApiKey()
  public async createFortuneJob(
    @Request() req: RequestWithUser,
    @Body() data: JobFortuneDto,
  ): Promise<number> {
    return this.jobService.createJob(req.user.id, JobRequestType.FORTUNE, data);
  }

  @ApiOperation({
    summary: 'Create a CVAT job',
    description: 'Endpoint to create a new CVAT job.',
  })
  @ApiBody({ type: JobCvatDto })
  @ApiResponse({
    status: 200,
    description: 'ID of the created CVAT job.',
    type: Number,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  @Post('/cvat')
  public async createCvatJob(
    @Request() req: RequestWithUser,
    @Body() data: JobCvatDto,
  ): Promise<number> {
    return this.jobService.createJob(req.user.id, data.type, data);
  }

  @Post('/hCaptcha')
  public async createCaptchaJob(
    @Request() req: RequestWithUser,
    @Body() data: JobCaptchaDto,
  ): Promise<number> {
    return this.jobService.createJob(
      req.user.id,
      JobRequestType.HCAPTCHA,
      data,
    );
  }

  @ApiOperation({
    summary: 'Get a list of jobs',
    description:
      'Endpoint to retrieve a list of jobs based on specified filters.',
  })
  @ApiQuery({
    name: 'networks',
    required: true,
    enum: ChainId,
    type: [String],
    isArray: true,
  })
  @ApiQuery({ name: 'status', required: false, enum: JobStatusFilter })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of jobs based on specified filters.',
    type: [JobListDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @Get('/list')
  public async getJobList(
    @Request() req: RequestWithUser,
    @Query('networks') networks: ChainId[],
    @Query('status') status: JobStatusFilter,
    @Query('skip') skip = 0,
    @Query('limit') limit = 10,
  ): Promise<JobListDto[] | BadRequestException> {
    networks = !Array.isArray(networks) ? [networks] : networks;
    return this.jobService.getJobsByStatus(
      networks,
      req.user.id,
      status,
      skip,
      limit,
    );
  }

  @ApiOperation({
    summary: 'Get the result of a job',
    description: 'Endpoint to retrieve the result of a specified job.',
  })
  @ApiKey()
  @ApiResponse({
    status: 200,
    description: 'Result of the specified job.',
    type: [FortuneFinalResultDto], // Adjust the type based on the actual return type
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @Get('/result')
  public async getResult(
    @Request() req: RequestWithUser,
    @Query('jobId') jobId: number,
  ): Promise<FortuneFinalResultDto[] | string> {
    return this.jobService.getResult(req.user.id, jobId);
  }

  @ApiOperation({
    summary: 'Launch a cron job',
    description: 'Endpoint to launch a cron job.',
  })
  @Public()
  @ApiResponse({
    status: 200,
    description: 'Cron job launched successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  @Get('/cron/launch')
  public async launchCronJob(): Promise<void> {
    await this.jobService.launchCronJob();
    return;
  }

  @ApiOperation({
    summary: 'Cancel a job',
    description: 'Endpoint to cancel a specified job.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cancellation request for the specified job accepted',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  @Patch('/cancel/:id')
  public async cancelJob(
    @Request() req: RequestWithUser,
    @Param() params: JobCancelDto,
  ): Promise<void> {
    await this.jobService.requestToCancelJob(req.user.id, params.id);
    return;
  }

  @ApiOperation({
    summary: 'Cancel a cron job',
    description: 'Endpoint to cancel a cron job.',
  })
  @Public()
  @ApiResponse({
    status: 200,
    description: 'Cron job launched successfully.',
  })
  @Get('/cron/cancel')
  public async cancelCronJob(): Promise<void> {
    await this.jobService.cancelCronJob();
    return;
  }

  @ApiOperation({
    summary: 'Handle escrow failed webhook',
    description: 'Endpoint to handle an escrow failed webhook.',
  })
  @Public()
  @UseGuards(new SignatureAuthGuard([Role.Exchange]))
  @ApiResponse({
    status: 200,
    description: 'Escrow failed webhook handled successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @Post('/escrow-failed-webhook')
  public async handleEscrowFailedWebhook(
    @Headers(HEADER_SIGNATURE_KEY) _: string,
    @Body() data: EscrowFailedWebhookDto,
  ): Promise<void> {
    await this.jobService.escrowFailedWebhook(data);
    return;
  }

  @ApiOperation({
    summary: 'Get details of a job',
    description: 'Endpoint to retrieve details of a specified job.',
  })
  @ApiResponse({
    status: 200,
    description: 'Details of the specified job',
    type: JobDetailsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  @Get('/details/:id')
  public async getDetails(
    @Request() req: RequestWithUser,
    @Param() params: JobIdDto,
  ): Promise<JobDetailsDto> {
    return this.jobService.getDetails(req.user.id, params.id);
  }
}
