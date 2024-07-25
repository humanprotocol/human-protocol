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
import {
  GetJobsDto,
  JobDto,
  SolveJobDto,
  SolveJobResponseDto,
} from './job.dto';
import { JobService } from './job.service';
import { HEADER_SIGNATURE_KEY } from '../../common/constant';
import { RequestWithUser } from '../../common/types/jwt';
import { PageDto } from '../../common/pagination/pagination.dto';
import { AuthSignatureRole, Role } from '../../common/enums/role';
import { SignatureAuthGuard } from '../../common/guards/signature.auth';
import { AllowedRoles } from '../../common/decorators/role';

@ApiTags('Job')
@Controller('job')
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
  @UseGuards(JwtAuthGuard)
  @AllowedRoles([Role.Worker, Role.HumanApp])
  @ApiBearerAuth()
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
    type: SolveJobResponseDto,
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
  @UseGuards(SignatureAuthGuard)
  @AllowedRoles([AuthSignatureRole.Worker])
  async solveJob(
    @Headers(HEADER_SIGNATURE_KEY) signature: string,
    @Body() solveJobDto: SolveJobDto,
  ): Promise<SolveJobResponseDto> {
    const { assignmentId, solution } = solveJobDto;

    await this.jobService.solveJob(Number(assignmentId), solution);

    const response: SolveJobResponseDto = {
      assignmentId,
      solution,
      message: 'Job solved successfully.',
    };
    return response;
  }
}
