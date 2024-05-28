import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
  Headers,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiHeader,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.auth';
import { GetJobsDto, JobDto, SolveJobDto } from './job.dto';
import { JobService } from './job.service';
import { HEADER_SIGNATURE_KEY } from '../../common/constant';
import { RequestWithUser } from '../../common/types/jwt';
import { PageDto } from '../../common/pagination/pagination.dto';
import { Role } from '../../common/enums/role';
import { SignatureAuthGuard } from '../../common/guards/signature.auth';
import { Public } from '../../common/decorators';

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
  @ApiHeader({
    name: HEADER_SIGNATURE_KEY,
    description: 'Signature header for authenticating the webhook request.',
    required: true,
  })
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
  @Public()
  @UseGuards(new SignatureAuthGuard([Role.Worker]))
  solveJob(
    @Request() req: RequestWithUser,
    @Headers(HEADER_SIGNATURE_KEY) _: string,
    @Body() data: SolveJobDto,
  ): Promise<void> {
    return this.jobService.solveJob(data.assignmentId, data.solution);
  }
}
