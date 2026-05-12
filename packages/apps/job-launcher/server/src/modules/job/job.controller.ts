import { ChainId } from '@human-protocol/sdk';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MUTEX_TIMEOUT } from '../../common/constants';
import { ApiKey } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards';
import { PageDto } from '../../common/pagination/pagination.dto';
import { RequestWithUser } from '../../common/types';
import { MutexManagerService } from '../mutex/mutex-manager.service';
import {
  FortuneFinalResultDto,
  GetJobsDto,
  JobCancelDto,
  JobDetailsDto,
  JobIdDto,
  JobListDto,
  JobManifestDto,
  JobQuickLaunchDto,
} from './job.dto';
import { JobService } from './job.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiKey()
@ApiTags('Job')
@Controller('/job')
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly mutexManagerService: MutexManagerService,
  ) {}

  @ApiOperation({
    summary: 'Create a job via quick launch',
    description: 'Endpoint to create a new job using pre-definde manifest url.',
  })
  @ApiBody({ type: JobQuickLaunchDto })
  @ApiResponse({
    status: 201,
    description:
      'ID of the created job with pre-definde manifest url via quick launch.',
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
    status: 409,
    description: 'Conflict. Conflict with the current state of the server.',
  })
  @Post('/quick-launch')
  public async quickLaunch(
    @Body() data: JobQuickLaunchDto,
    @Request() req: RequestWithUser,
  ): Promise<number> {
    return await this.mutexManagerService.runExclusive(
      `user${req.user.id}`,
      MUTEX_TIMEOUT,
      async () => {
        return await this.jobService.createJob(
          req.user,
          data.requestType,
          data,
        );
      },
    );
  }

  @ApiOperation({
    summary: 'Create a job',
    description: 'Endpoint to create a new job using a manifest JSON body.',
  })
  @ApiBody({ type: JobManifestDto })
  @ApiResponse({
    status: 201,
    description: 'ID of the created job.',
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
    status: 409,
    description: 'Conflict. Conflict with the current state of the server.',
  })
  @Post()
  public async createJob(
    @Body() data: JobManifestDto,
    @Request() req: RequestWithUser,
  ): Promise<number> {
    return await this.mutexManagerService.runExclusive(
      `user${req.user.id}`,
      MUTEX_TIMEOUT,
      async () => {
        return await this.jobService.createJob(
          req.user,
          data.requestType,
          data,
        );
      },
    );
  }

  @ApiOperation({
    summary: 'Get a list of jobs',
    description:
      'Endpoint to retrieve a list of jobs based on specified filters.',
  })
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
    @Query() data: GetJobsDto,
    @Request() req: RequestWithUser,
  ): Promise<PageDto<JobListDto>> {
    return this.jobService.getJobsByStatus(data, req.user.id);
  }

  @ApiOperation({
    summary: 'Get the result of a job',
    description: 'Endpoint to retrieve the result of a specified job.',
  })
  @ApiResponse({
    status: 200,
    description: 'Result of the specified job.',
    type: [FortuneFinalResultDto], // Adjust the type based on the actual return type
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  @Get('/result/:id')
  public async getResult(
    @Param() params: JobIdDto,
    @Request() req: RequestWithUser,
  ): Promise<FortuneFinalResultDto[] | string> {
    return this.jobService.getResult(req.user.id, params.id);
  }

  @Get('result/:id/download')
  public async downloadResult(
    @Param() params: JobIdDto,
    @Request() req: RequestWithUser,
  ): Promise<StreamableFile> {
    const decryptedResult = await this.jobService.downloadJobResults(
      req.user.id,
      params.id,
    );
    return new StreamableFile(decryptedResult.contents, {
      disposition: `attachment; filename="${decryptedResult.filename}"`,
    });
  }

  @ApiOperation({
    summary: 'Cancel a job',
    description:
      'Endpoint to cancel a specified job by its associated chain ID and escrow address.',
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
  @ApiResponse({
    status: 409,
    description: 'Conflict. Conflict with the current state of the server.',
  })
  @Patch('/cancel/:chain_id/:escrow_address')
  public async cancelJobByChainIdAndEscrowAddress(
    @Param('chain_id') chainId: ChainId,
    @Param('escrow_address') escrowAddress: string,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    await this.mutexManagerService.runExclusive(
      `user${req.user.id}`,
      MUTEX_TIMEOUT,
      async () => {
        return await this.jobService.requestToCancelJobByAddress(
          req.user.id,
          chainId,
          escrowAddress,
        );
      },
    );
    return;
  }

  @ApiOperation({
    summary: 'Cancel a job',
    description: 'Endpoint to cancel a specified job by its unique identifier.',
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
  @ApiResponse({
    status: 409,
    description: 'Conflict. Conflict with the current state of the server.',
  })
  @Patch('/cancel/:id')
  public async cancelJobById(
    @Param() params: JobCancelDto,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    await this.mutexManagerService.runExclusive(
      `user${req.user.id}`,
      MUTEX_TIMEOUT,
      async () => {
        return await this.jobService.requestToCancelJobById(
          req.user.id,
          params.id,
        );
      },
    );
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
    @Param() params: JobIdDto,
    @Request() req: RequestWithUser,
  ): Promise<JobDetailsDto> {
    return this.jobService.getDetails(req.user.id, params.id);
  }
}
