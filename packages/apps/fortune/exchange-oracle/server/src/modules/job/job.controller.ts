import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.auth';
import { GetJobsDto, JobDto, SolveJobDto } from './job.dto';
import { JobService } from './job.service';
import { RequestWithUser } from '../../common/types/jwt';
import { PageDto } from '../../common/pagination/pagination.dto';

@ApiTags('Job')
@Controller('job')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobController {
  constructor(private readonly jobService: JobService) {}
  @ApiOperation({
    summary: 'Get Jobs',
    description: 'Endpoint to retrieve a list of jobs.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    type: PageDto<JobDto>,
    description: 'List of jobs retrieved successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @Get()
  getJobs(
    @Request() req: RequestWithUser,
    @Query() query: GetJobsDto,
  ): Promise<PageDto<JobDto>> {
    return this.jobService.getJobList(query, req.user.reputationNetwork);
  }

  @ApiOperation({
    summary: 'Solve Job',
    description: 'Endpoint to solve a job.',
  })
  @ApiBearerAuth()
  @ApiBody({
    description: 'Details required to solve the job.',
    type: SolveJobDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Job solved successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @Post('solve')
  solveJob(
    @Request() req: RequestWithUser,
    @Body() body: SolveJobDto,
  ): Promise<void> {
    return this.jobService.solveJob(
      body.chainId,
      body.escrowAddress,
      req.user.address,
      body.solution,
    );
  }
}
